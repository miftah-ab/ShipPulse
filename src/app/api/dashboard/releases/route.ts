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

    const serviceDb = createServiceClient()

    // 1. Lookup project with fallback matching
    let { data: project } = await serviceDb
      .from('shippulse_projects')
      .select('id, workspace_id, name, slug')
      .eq('slug', projectSlug)
      .is('deleted_at', null)
      .maybeSingle()

    if (!project) {
      const { data: matched } = await serviceDb
        .from('shippulse_projects')
        .select('id, workspace_id, name, slug')
        .ilike('slug', `${projectSlug}%`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      project = matched
    }

    if (!project) {
      // Check user workspaces for any project
      const { data: userMemberships } = await serviceDb
        .from('shippulse_memberships')
        .select('workspace_id')
        .eq('user_id', user.id)

      if (userMemberships && userMemberships.length > 0) {
        const workspaceIds = userMemberships.map((m: any) => m.workspace_id)
        const { data: anyProj } = await serviceDb
          .from('shippulse_projects')
          .select('id, workspace_id, name, slug')
          .in('workspace_id', workspaceIds)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        project = anyProj
      }
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // 2. Verify membership
    const { data: membership } = await serviceDb
      .from('shippulse_memberships')
      .select('role')
      .eq('workspace_id', project.workspace_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied to this workspace' }, { status: 403 })
    }

    // 3. Fetch real releases with join, fallback to direct query if join fails
    let releases: any[] | null = null
    const { data: joinedReleases, error: rErr } = await serviceDb
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
      console.warn('[Dashboard Releases] Joined query failed, falling back to direct query:', rErr.message)
      const { data: directReleases, error: directErr } = await serviceDb
        .from('shippulse_releases')
        .select(`
          id, title, slug, summary, version, status,
          published_at, created_at, updated_at, tags,
          views_count, reactions_count, feedback_count,
          category_id
        `)
        .eq('project_id', project.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (directErr) {
        console.error('[Dashboard Releases] Direct query failed:', directErr.message)
        return NextResponse.json({ error: 'Failed to fetch releases: ' + directErr.message }, { status: 500 })
      }
      releases = directReleases
    } else {
      releases = joinedReleases
    }

    // If 0 releases exist, automatically attempt an initial auto-sync if a repository is connected
    if (!releases || releases.length === 0) {
      try {
        const { data: conn } = await serviceDb
          .from('shippulse_repository_connections')
          .select('id')
          .eq('project_id', project.id)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle()

        if (conn) {
          const { runProjectSync } = await import('@/lib/sync/sync-service')
          const syncRes = await runProjectSync({
            projectId: project.id,
            userId: user.id,
            force: true,
          })

          if (syncRes.success) {
            const { data: freshReleases } = await serviceDb
              .from('shippulse_releases')
              .select(`
                id, title, slug, summary, version, status,
                published_at, created_at, updated_at, tags,
                views_count, reactions_count, feedback_count,
                category_id
              `)
              .eq('project_id', project.id)
              .is('deleted_at', null)
              .order('created_at', { ascending: false })

            if (freshReleases && freshReleases.length > 0) {
              releases = freshReleases
            }
          }
        }
      } catch (autoErr: any) {
        console.warn('[Dashboard Releases] Auto-sync on load error:', autoErr.message)
      }
    }

    return NextResponse.json({ releases: releases ?? [] })
  } catch (err: any) {
    console.error('[Dashboard Releases] Error:', err.message)
    return NextResponse.json({ error: 'Internal server error: ' + (err.message || 'Unknown') }, { status: 500 })
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
        created_by: user.id,
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

