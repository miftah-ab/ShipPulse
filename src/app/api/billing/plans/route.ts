// ============================================================
// GET /api/billing/plans
// Returns active workspace plan, limits, usage, and upgrade pricing
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getWorkspaceUsageSummary } from '@/lib/billing/entitlements'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get('projectSlug')

    const serviceDb = createServiceClient()

    // 1. Resolve workspace
    let workspaceId: string | null = null

    if (projectSlug) {
      const { data: project } = await serviceDb
        .from('shippulse_projects')
        .select('workspace_id')
        .eq('slug', projectSlug)
        .is('deleted_at', null)
        .maybeSingle()

      if (project?.workspace_id) {
        workspaceId = project.workspace_id
      }
    }

    if (!workspaceId) {
      const { data: membership } = await serviceDb
        .from('shippulse_memberships')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      workspaceId = membership?.workspace_id ?? null
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'No workspace found for user' }, { status: 404 })
    }

    // 2. Fetch summary
    const summary = await getWorkspaceUsageSummary(serviceDb, workspaceId)

    return NextResponse.json(summary)
  } catch (err: any) {
    console.error('[API /api/billing/plans] Error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
