import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export default async function DashboardRedirect() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/dashboard')
  }

  const serviceDb = createServiceClient()

  // 1. Try via membership
  const { data: memberships } = await serviceDb
    .from('shippulse_memberships')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(5)

  if (memberships && memberships.length > 0) {
    const workspaceIds = memberships.map((m: any) => m.workspace_id)
    const { data: project } = await serviceDb
      .from('shippulse_projects')
      .select('slug')
      .in('workspace_id', workspaceIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (project?.slug) {
      redirect(`/${project.slug}/releases`)
    }

    // Has workspace but no project yet — go to onboarding
    redirect('/onboarding')
  }

  // 2. Fallback: check if user created projects directly
  const { data: directProject } = await serviceDb
    .from('shippulse_projects')
    .select('slug')
    .eq('created_by', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (directProject?.slug) {
    redirect(`/${directProject.slug}/releases`)
  }

  // 3. New user without workspace: auto-provision default workspace first
  try {
    const githubLogin = user.user_metadata?.user_name ?? user.user_metadata?.login ?? 'my'
    const workspaceName = `${githubLogin}'s Workspace`
    const baseSlug = (githubLogin || 'workspace').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const workspaceSlug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`

    const { data: newWorkspace } = await serviceDb
      .from('shippulse_workspaces')
      .insert({
        name: workspaceName,
        slug: workspaceSlug,
        created_by: user.id,
        plan: 'free',
      })
      .select('id')
      .single()

    if (newWorkspace?.id) {
      await serviceDb.from('shippulse_memberships').insert({
        workspace_id: newWorkspace.id,
        user_id: user.id,
        role: 'owner',
      })
    }
  } catch (err: any) {
    console.error('[Dashboard] Error auto-provisioning workspace:', err.message)
  }

  redirect('/onboarding')
}
