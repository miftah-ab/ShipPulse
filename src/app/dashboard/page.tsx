import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export default async function DashboardRedirect() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/dashboard')
  }

  // Query the user's workspace membership and projects
  const serviceDb = createServiceClient()
  const { data: memberships } = await serviceDb
    .from('shippulse_memberships')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)

  const workspaceId = memberships?.[0]?.workspace_id

  if (workspaceId) {
    const { data: project } = await serviceDb
      .from('shippulse_projects')
      .select('slug')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (project?.slug) {
      redirect(`/${project.slug}/releases`)
    }
  }

  // If user has no workspaces or projects yet, direct them to onboarding
  redirect('/onboarding')
}

