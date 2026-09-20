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

    // Has workspace but no project yet (edge case) — go to onboarding to create first project
    redirect('/onboarding')
  }

  // 2. Fallback: check if user created projects directly (without memberships row — data integrity issue)
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

  // 3. Truly new user: onboarding
  redirect('/onboarding')
}
