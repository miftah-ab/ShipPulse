// ============================================================
// GET  /api/public/changelog/[slug]/releases
// GET  /api/public/changelog/[slug]/releases/[releaseSlug]
// Public, unauthenticated — only returns published releases
// on public projects. Rate limited.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, getIdentifier, RATE_LIMITS } from '@/lib/rate-limit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createServiceClient()

  // Rate limit
  const identifier = getIdentifier(request)
  const rateLimit = await checkRateLimit(supabase, {
    identifier,
    endpoint: 'public_changelog',
    limitPerMinute: RATE_LIMITS.public,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, {
      status: 429,
      headers: { 'Retry-After': '60' },
    })
  }

  // Lookup project — must be public and not private
  const { data: project, error: projectError } = await supabase
    .from('shippulse_projects')
    .select(`
      id, name, slug, description, logo_url, brand_accent_color,
      changelog_theme, is_public, search_visibility,
      show_subscribe, show_search, show_categories
    `)
    .eq('slug', slug)
    .eq('is_public', true)
    .not('search_visibility', 'eq', 'private')
    .is('deleted_at', null)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Changelog not found' }, { status: 404 })
  }

  // Parse query params
  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const perPage = Math.min(50, Math.max(1, parseInt(url.searchParams.get('per_page') ?? '20')))
  const category = url.searchParams.get('category')
  const search = url.searchParams.get('q')

  // Build query
  let query = supabase
    .from('shippulse_releases')
    .select(`
      id, title, slug, summary, content_html, version, published_at,
      tags, views_count, reactions_count, feedback_count,
      shippulse_categories(id, name, slug, label, color),
      shippulse_release_entries(id, title, description, sort_order,
        shippulse_categories(name, slug, label, color))
    `, { count: 'exact' })
    .eq('project_id', project.id)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (category) {
    query = query.eq('shippulse_categories.slug', category)
  }

  if (search) {
    query = query.textSearch('title', search, { type: 'websearch' })
  }

  const { data: releases, count, error } = await query

  if (error) {
    console.error('[Public API] Releases query error:', error.message)
    return NextResponse.json({ error: 'Failed to load releases' }, { status: 500 })
  }

  // Track page view (non-blocking, fire and forget)
  supabase
    .from('shippulse_changelog_views')
    .insert({
      project_id: project.id,
      visitor_hash: hashVisitor(identifier),
      referrer: request.headers.get('referer') ?? null,
      user_agent: request.headers.get('user-agent') ?? null,
    })
    .then(() => {})

  return NextResponse.json(
    {
      project: {
        name: project.name,
        slug: project.slug,
        description: project.description,
        logo_url: project.logo_url,
        accent_color: project.brand_accent_color,
        theme: project.changelog_theme,
        show_subscribe: project.show_subscribe,
        show_search: project.show_search,
        show_categories: project.show_categories,
      },
      releases: releases ?? [],
      pagination: {
        page,
        per_page: perPage,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / perPage),
      },
    },
    {
      headers: {
        // Public changelog data can be cached for 60s
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    }
  )
}

function hashVisitor(identifier: string): string {
  // Simple hash for analytics — no PII stored
  const { createHash } = require('crypto')
  return createHash('sha256').update(identifier + process.env.APP_SECRET).digest('hex').slice(0, 16)
}
