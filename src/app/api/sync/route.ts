// ============================================================
// POST /api/sync
// Trigger repository synchronization & AI change analysis
// Fetches real commits from GitHub using the project's repo_url
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { analyzeChanges } from '@/lib/sync/engine'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const projectSlug = body.projectSlug

    if (!projectSlug) {
      return NextResponse.json({ error: 'projectSlug is required' }, { status: 400 })
    }

    const serviceDb = createServiceClient()

    // Find project
    const { data: project, error: pErr } = await serviceDb
      .from('shippulse_projects')
      .select('id, workspace_id, name, slug')
      .eq('slug', projectSlug)
      .is('deleted_at', null)
      .maybeSingle()

    if (pErr || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify user workspace membership
    const { data: membership } = await serviceDb
      .from('shippulse_memberships')
      .select('role')
      .eq('workspace_id', project.workspace_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Find active repository connection
    const { data: connection } = await serviceDb
      .from('shippulse_repository_connections')
      .select('id')
      .eq('project_id', project.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (!connection) {
      return NextResponse.json({
        error: 'No repository connected. Configure a GitHub repository in the Integrations page first.',
      }, { status: 422 })
    }

    const { runProjectSync } = await import('@/lib/sync/sync-service')
    const result = await runProjectSync({
      projectId: project.id,
      userId: user.id,
      force: true,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 422 })
    }

    return NextResponse.json({
      success: true,
      commitsIngested: result.commitsIngested,
      releaseCreated: result.releaseCreated ? result.releaseCreated.id : null,
      message: result.message,
    })
  } catch (err: any) {
    console.error('[API /api/sync] Error:', err.message)
    return NextResponse.json({ error: err.message || 'Sync failed' }, { status: 500 })
  }
}
