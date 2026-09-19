// ============================================================
// GET  /api/dashboard/integration?projectSlug=...
// PATCH /api/dashboard/integration — save connected GitHub repo
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get('projectSlug')
    if (!projectSlug) return NextResponse.json({ error: 'projectSlug is required' }, { status: 400 })

    const serviceDb = createServiceClient()

    const { data: project } = await serviceDb
      .from('shippulse_projects')
      .select('id, workspace_id, repo_url, default_branch, last_synced_at')
      .eq('slug', projectSlug)
      .is('deleted_at', null)
      .maybeSingle()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const hasRepo = !!project.repo_url

    return NextResponse.json({
      repo: hasRepo
        ? {
            repoUrl: project.repo_url,
            defaultBranch: project.default_branch || 'main',
            lastSync: project.last_synced_at
              ? new Date(project.last_synced_at).toLocaleString()
              : 'Never',
          }
        : null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { projectSlug, repoUrl, defaultBranch, repoFullName } = body

    if (!projectSlug || !repoUrl) {
      return NextResponse.json({ error: 'projectSlug and repoUrl are required' }, { status: 400 })
    }

    const serviceDb = createServiceClient()

    const { data: project } = await serviceDb
      .from('shippulse_projects')
      .select('id, workspace_id')
      .eq('slug', projectSlug)
      .is('deleted_at', null)
      .maybeSingle()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const { data: membership } = await serviceDb
      .from('shippulse_memberships')
      .select('role')
      .eq('workspace_id', project.workspace_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await serviceDb
      .from('shippulse_projects')
      .update({
        repo_url: repoUrl,
        default_branch: defaultBranch || 'main',
        updated_at: new Date().toISOString(),
      })
      .eq('id', project.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to save integration' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
