// ============================================================
// GET /api/public/changelog?projectSlug=...
// Public endpoint — no auth required. Returns published releases.
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

    const { data: project } = await serviceDb
      .from('shippulse_projects')
      .select('id, name, slug')
      .eq('slug', projectSlug)
      .eq('is_public', true)
      .is('deleted_at', null)
      .maybeSingle()

    if (!project) {
      return NextResponse.json({ error: 'Changelog not found' }, { status: 404 })
    }

    const { data: releases } = await serviceDb
      .from('shippulse_releases')
      .select('id, version, title, summary, content, tags, published_at, views_count, reactions_count')
      .eq('project_id', project.id)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('published_at', { ascending: false })

    // Increment view count (fire and forget)
    void serviceDb
      .rpc('increment_changelog_views', { p_project_id: project.id })
      .then(() => {})


    return NextResponse.json({
      projectName: project.name,
      slug: project.slug,
      releases: (releases ?? []).map((r) => ({
        id: r.id,
        version: r.version || null,
        title: r.title,
        summary: r.summary || '',
        content: r.content || '',
        categories: Array.isArray(r.tags) ? r.tags : [],
        publishedAt: r.published_at,
        views: r.views_count ?? 0,
        reactions: r.reactions_count ?? 0,
      })),
    })
  } catch (err: any) {
    console.error('[Public Changelog] Error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
