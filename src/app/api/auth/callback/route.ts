// ============================================================
// GET /api/auth/callback
// Exchange GitHub OAuth code for session + persist provider_token
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('GitHub authorization was denied or failed.')}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('No authorization code received from GitHub.')}`
    )
  }

  const supabase = await createClient()

  const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[Auth] Code exchange failed:', exchangeError.message)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
    )
  }

  // ── Persist user and GitHub details ────────────────────────
  const providerToken = sessionData?.session?.provider_token
  const user = sessionData?.user
  const userId = user?.id

  if (userId && user) {
    try {
      const serviceClient = createServiceClient()

      const githubLogin =
        user.user_metadata?.user_name ??
        user.user_metadata?.login ??
        user.user_metadata?.preferred_username ??
        null

      const userRecord: any = {
        id: userId,
        email: user.email ?? '',
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? githubLogin ?? 'Developer',
        avatar_url: user.user_metadata?.avatar_url ?? null,
        github_login: githubLogin,
        github_id: user.user_metadata?.provider_id ? Number(user.user_metadata.provider_id) : null,
      }

      if (providerToken) {
        userRecord.github_access_token = providerToken
        userRecord.github_token_updated = new Date().toISOString()
      }

      await serviceClient
        .from('shippulse_users')
        .upsert(userRecord, { onConflict: 'id' })

      console.log(`[Auth] User profile and token updated for user ${userId}`)

      // ── Ensure user has a workspace ────────────────────────────
      const { data: memberships } = await serviceClient
        .from('shippulse_memberships')
        .select('workspace_id')
        .eq('user_id', userId)
        .limit(1)

      let workspaceId = memberships?.[0]?.workspace_id

      if (!workspaceId) {
        // Auto-provision primary workspace for the new user
        const baseName = githubLogin ? `${githubLogin}'s Workspace` : 'My Workspace'
        const baseSlug = (githubLogin || 'workspace').toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const workspaceSlug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`

        const { data: newWorkspace, error: wErr } = await serviceClient
          .from('shippulse_workspaces')
          .insert({
            name: baseName,
            slug: workspaceSlug,
            created_by: userId,
            plan: 'free',
          })
          .select('id')
          .single()

        if (newWorkspace?.id) {
          workspaceId = newWorkspace.id
          await serviceClient.from('shippulse_memberships').insert({
            workspace_id: newWorkspace.id,
            user_id: userId,
            role: 'owner',
          })
          console.log(`[Auth] Auto-provisioned workspace ${workspaceId} for user ${userId}`)
        } else if (wErr) {
          console.error('[Auth] Failed to auto-provision workspace:', wErr.message)
        }
      }

      // ── Check if user has an existing project ──────────────────
      if (workspaceId) {
        const { data: project } = await serviceClient
          .from('shippulse_projects')
          .select('slug')
          .eq('workspace_id', workspaceId)
          .is('deleted_at', null)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (project?.slug) {
          return NextResponse.redirect(`${origin}/${project.slug}/releases`)
        }
      }
    } catch (err: any) {
      console.error('[Auth] Error in callback provisioning:', err.message)
    }
  }

  // If user has no project yet: guide seamlessly to onboarding
  const redirectTo = next && next !== '/dashboard' ? next : '/onboarding'
  return NextResponse.redirect(`${origin}${redirectTo}`)
}
