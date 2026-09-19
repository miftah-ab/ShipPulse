// ============================================================
// GET  /api/projects
// POST /api/projects
// Lists or creates real production projects for the user's workspace
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateUniqueSlug } from '@/lib/slugs'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceDb = createServiceClient()

    // Get user's workspaces
    const { data: memberships } = await serviceDb
      .from('shippulse_memberships')
      .select('workspace_id')
      .eq('user_id', user.id)

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ projects: [] })
    }

    const workspaceIds = memberships.map((m) => m.workspace_id)

    // Fetch projects
    const { data: projects, error } = await serviceDb
      .from('shippulse_projects')
      .select('id, name, slug, description, is_public, created_at, workspace_id')
      .in('workspace_id', workspaceIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[API /api/projects] Error:', error.message)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    return NextResponse.json({ projects: projects ?? [] })
  } catch (err: any) {
    console.error('[API /api/projects] Error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { name, workspaceId } = body

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    const serviceDb = createServiceClient()

    // Verify workspace membership
    const { data: membership } = await serviceDb
      .from('shippulse_memberships')
      .select('workspace_id, role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 403 })
    }

    // Get existing slugs
    const { data: existing } = await serviceDb
      .from('shippulse_projects')
      .select('slug')

    const existingSlugs = (existing ?? []).map((p) => p.slug)
    const slug = generateUniqueSlug(name, existingSlugs)

    const { data: project, error: insertError } = await serviceDb
      .from('shippulse_projects')
      .insert({
        workspace_id: workspaceId,
        name,
        slug,
        is_public: true,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch (err: any) {
    console.error('[API /api/projects POST] Error:', err.message)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
