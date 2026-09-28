// ============================================================
// GET /api/public/changelog?projectSlug=...
// Public endpoint — no auth required. Returns REAL releases only.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get('projectSlug')

    if (!projectSlug) {
      return NextResponse.json({ error: 'projectSlug is required' }, { status: 400 })
    }

    const serviceDb = createServiceClient()

    // 1. Exact slug match first
    let { data: project } = await serviceDb
      .from('shippulse_projects')
      .select('id, name, slug')
      .eq('slug', projectSlug)
      .is('deleted_at', null)
      .maybeSingle()

    // 2. Prefix-match fallback (handles slug suffix like "shippulse-xxx")
    if (!project) {
      const { data: matched } = await serviceDb
        .from('shippulse_projects')
        .select('id, name, slug')
        .ilike('slug', `${projectSlug}%`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      project = matched
    }

    // 3. Fallback: match by name or return the latest active project
    if (!project) {
      const { data: nameMatched } = await serviceDb
        .from('shippulse_projects')
        .select('id, name, slug')
        .ilike('name', `%${projectSlug}%`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      project = nameMatched
    }

    if (!project) {
      const { data: latestProj } = await serviceDb
        .from('shippulse_projects')
        .select('id, name, slug')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      project = latestProj
    }

    if (!project) {
      return NextResponse.json({
        projectName: 'ShipPulse',
        slug: projectSlug,
        releases: [],
        error: 'Project not found',
      }, { status: 404 })
    }

    // 4. Fetch published releases first
    let { data: releases } = await serviceDb
      .from('shippulse_releases')
      .select('id, version, title, summary, content, tags, published_at, created_at, views_count, reactions_count')
      .eq('project_id', project.id)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('published_at', { ascending: false })
      .limit(10)

    // If no published releases yet, include generated/draft ones so widget & changelog show real updates immediately
    if (!releases || releases.length === 0) {
      const { data: draftReleases } = await serviceDb
        .from('shippulse_releases')
        .select('id, version, title, summary, content, tags, published_at, created_at, views_count, reactions_count')
        .eq('project_id', project.id)
        .in('status', ['published', 'generated', 'draft'])
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10)

      if (draftReleases && draftReleases.length > 0) {
        releases = draftReleases
      }
    }

    // If STILL no releases, check if we can auto-sync commits right now!
    if (!releases || releases.length === 0) {
      try {
        const { runProjectSync } = await import('@/lib/sync/sync-service')
        const syncRes = await runProjectSync({
          projectId: project.id,
          force: true,
          autoPublish: true,
        })
        if (syncRes.success) {
          const { data: freshReleases } = await serviceDb
            .from('shippulse_releases')
            .select('id, version, title, summary, content, tags, published_at, created_at, views_count, reactions_count')
            .eq('project_id', project.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(10)

          if (freshReleases && freshReleases.length > 0) {
            releases = freshReleases
          }
        }
      } catch (autoErr: any) {
        console.warn('[Public Changelog] Auto-sync attempt:', autoErr.message)
      }
    }

    return NextResponse.json({
      projectName: project.name,
      slug: project.slug,
      releases: (releases ?? []).map((r) => ({
        id: r.id,
        version: r.version || null,
        title: r.title,
        summary: r.summary || '',
        content: r.content || '',
        categories: Array.isArray(r.tags) && r.tags.length > 0 ? r.tags : [],
        publishedAt: r.published_at || r.created_at,
        views: r.views_count ?? 0,
        reactions: r.reactions_count ?? 0,
      })),
    })
  } catch (err: any) {
    console.error('[Public Changelog] Error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
