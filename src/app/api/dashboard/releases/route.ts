// ============================================================
// GET  /api/dashboard/releases?projectSlug=...
// Authenticated endpoint to fetch real releases for a project
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get('projectSlug')

    if (!projectSlug) {
      return NextResponse.json({ error: 'projectSlug is required' }, { status: 400 })
    }

    // Lookup project and ensure user has workspace membership
    const serviceDb = createServiceClient()
    const { data: project, error: pErr } = await serviceDb
      .from('shippulse_projects')
      .select('id, workspace_id, name, slug')
      .eq('slug', projectSlug)
      .is('deleted_at', null)
      .maybeSingle()

    if (pErr || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify membership
    const { data: membership } = await serviceDb
      .from('shippulse_memberships')
      .select('role')
      .eq('workspace_id', project.workspace_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied to this workspace' }, { status: 403 })
    }

    // Fetch real releases
    const { data: releases, error: rErr } = await serviceDb
      .from('shippulse_releases')
      .select(`
        id, title, slug, summary, version, status,
        published_at, created_at, updated_at, tags,
        views_count, reactions_count, feedback_count,
        category_id,
        shippulse_categories(id, name, slug, label, color)
      `)
      .eq('project_id', project.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (rErr) {
      console.error('[Dashboard Releases] Query error:', rErr.message)
      return NextResponse.json({ error: 'Failed to fetch releases' }, { status: 500 })
    }

    return NextResponse.json({ releases: releases ?? [] })
  } catch (err: any) {
    console.error('[Dashboard Releases] Error:', err.message)
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

    const body = await request.json()
    const { projectSlug, title, version, content, status, tags } = body

    if (!projectSlug || !title) {
      return NextResponse.json({ error: 'projectSlug and title are required' }, { status: 400 })
    }

    const serviceDb = createServiceClient()
    const { data: project } = await serviceDb
      .from('shippulse_projects')
      .select('id, workspace_id')
      .eq('slug', projectSlug)
      .is('deleted_at', null)
      .maybeSingle()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const { data: membership } = await serviceDb
      .from('shippulse_memberships')
      .select('role')
      .eq('workspace_id', project.workspace_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const baseSlug = (title || 'release')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`

    const { data: release, error: insertErr } = await serviceDb
      .from('shippulse_releases')
      .insert({
        workspace_id: project.workspace_id,
        project_id: project.id,
        author_id: user.id,
        title,
        slug: uniqueSlug,
        version: version || null,
        content: content || '',
        summary: content ? content.slice(0, 200) : '',
        status: status || 'draft',
        published_at: status === 'published' ? new Date().toISOString() : null,
        tags: tags || [],
      })
      .select()
      .single()

    if (insertErr) {
      console.error('[Dashboard Releases POST] Error:', insertErr.message)
      return NextResponse.json({ error: 'Failed to create release' }, { status: 500 })
    }

    return NextResponse.json({ release }, { status: 201 })
  } catch (err: any) {
    console.error('[Dashboard Releases POST] Error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

