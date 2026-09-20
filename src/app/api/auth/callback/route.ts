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

  // ── Persist the GitHub provider_token ────────────────────────
  // Supabase only exposes the provider_token immediately after exchange.
  // We save it to the DB now so all subsequent API routes can use it.
  const providerToken = sessionData?.session?.provider_token
  const userId = sessionData?.user?.id

  if (providerToken && userId) {
    try {
      const serviceClient = createServiceClient()

      // Upsert user row (created by Supabase trigger on first sign-in, but
      // may not exist yet at this exact moment — be safe with upsert).
      await serviceClient
        .from('shippulse_users')
        .upsert(
          {
            id: userId,
            email: sessionData.user?.email ?? '',
            name: sessionData.user?.user_metadata?.full_name ?? sessionData.user?.user_metadata?.name ?? null,
            avatar_url: sessionData.user?.user_metadata?.avatar_url ?? null,
            github_login: sessionData.user?.user_metadata?.user_name ?? sessionData.user?.user_metadata?.login ?? null,
            github_id: sessionData.user?.user_metadata?.provider_id
              ? Number(sessionData.user.user_metadata.provider_id)
              : null,
            github_access_token: providerToken,
            github_token_updated: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )

      console.log(`[Auth] GitHub token persisted for user ${userId}`)
    } catch (err: any) {
      // Non-fatal: user can still proceed; repos page will show connect prompt
      console.error('[Auth] Failed to persist GitHub token:', err.message)
    }
  }

  // Redirect to onboarding if first time, otherwise dashboard
  const redirectTo = next.startsWith('/') ? next : '/dashboard'
  return NextResponse.redirect(`${origin}${redirectTo}`)
}
