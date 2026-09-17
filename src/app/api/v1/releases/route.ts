// ============================================================
// GET  /api/v1/releases         — list releases
// POST /api/v1/releases         — create release
// Public REST API — requires API key authentication
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { validateApiKey, extractApiKey, hasScope } from '@/lib/api-keys'
import { checkRateLimit, getIdentifier, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const supabase = createServiceClient()

  // ── API key auth ─────────────────────────────────────────
  const authHeader = request.headers.get('authorization')
  const rawKey = extractApiKey(authHeader)
  if (!rawKey) {
    return NextResponse.json(
      { error: 'Authentication required. Provide an API key via Authorization: Bearer sp_...' },
      { status: 401 }
    )
  }

  const keyResult = await validateApiKey(rawKey)
  if (!keyResult) {
    return NextResponse.json({ error: 'Invalid or revoked API key.' }, { status: 401 })
  }

  if (!hasScope(keyResult.keyRecord.scopes, 'read')) {
    return NextResponse.json({ error: 'API key does not have read scope.' }, { status: 403 })
  }

  // ── Rate limit ──────────────────────────────────────────
  const identifier = `apikey:${keyResult.keyRecord.id}`
  const rateLimit = await checkRateLimit(supabase, {
    identifier,
    endpoint: 'api_v1',
    limitPerMinute: RATE_LIMITS.api,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, {
      status: 429,
      headers: { 'Retry-After': '60', 'X-RateLimit-Remaining': '0' },
    })
  }

  // ── Query ─────────────────────────────────────────────
  const url = new URL(request.url)
  const projectId = url.searchParams.get('project_id') ?? keyResult.keyRecord.projectId
  const status = url.searchParams.get('status') ?? 'published'
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const perPage = Math.min(100, parseInt(url.searchParams.get('per_page') ?? '20'))

  // Verify project belongs to this key's workspace
  if (projectId) {
    const { data: project } = await supabase
      .from('shippulse_projects')
      .select('id, workspace_id')
      .eq('id', projectId)
      .single()

    if (!project || project.workspace_id !== keyResult.keyRecord.workspaceId) {
      return NextResponse.json({ error: 'Project not found or not accessible.' }, { status: 404 })
    }
  }

  let query = supabase
    .from('shippulse_releases')
    .select(`
      id, title, slug, summary, content, version, status,
      published_at, created_at, updated_at, tags, views_count,
      shippulse_categories(name, slug, label),
      shippulse_release_entries(id, title, description,
        shippulse_categories(name, slug, label))
    `, { count: 'exact' })
    .eq('workspace_id', keyResult.keyRecord.workspaceId)
    .is('deleted_at', null)
    .order('published_at', { ascending: false, nullsFirst: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (projectId) query = query.eq('project_id', projectId)
  if (status !== 'all') query = query.eq('status', status)

  const { data: releases, count, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch releases.' }, { status: 500 })
  }

  return NextResponse.json({
    data: releases ?? [],
    pagination: {
      page, per_page: perPage,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / perPage),
    },
  }, {
    headers: {
      'X-RateLimit-Remaining': String(rateLimit.remaining),
    },
  })
}

const CreateReleaseSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(500),
  summary: z.string().max(1000).optional(),
  content: z.string().max(50000).optional(),
  version: z.string().max(50).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  publishedAt: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  ctaText: z.string().max(100).optional(),
  ctaUrl: z.string().url().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()

  const authHeader = request.headers.get('authorization')
  const rawKey = extractApiKey(authHeader)
  if (!rawKey) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const keyResult = await validateApiKey(rawKey)
  if (!keyResult) {
    return NextResponse.json({ error: 'Invalid or revoked API key.' }, { status: 401 })
  }

  if (!hasScope(keyResult.keyRecord.scopes, 'write')) {
    return NextResponse.json({ error: 'API key does not have write scope.' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }) }

  const parsed = CreateReleaseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed.', details: parsed.error.flatten() }, { status: 422 })
  }

  const { projectId, title, summary, content, version, status, publishedAt, tags, ctaText, ctaUrl } = parsed.data

  // Verify project belongs to this workspace
  const { data: project } = await supabase
    .from('shippulse_projects')
    .select('id, workspace_id')
    .eq('id', projectId)
    .eq('workspace_id', keyResult.keyRecord.workspaceId)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 })
  }

  // Generate slug from title
  const { generateSlug, generateUniqueSlug } = await import('@/lib/slugs')
  const { data: existingReleases } = await supabase
    .from('shippulse_releases')
    .select('slug')
    .eq('project_id', projectId)
  const existingSlugs = (existingReleases ?? []).map((r) => r.slug)
  const slug = generateUniqueSlug(title, existingSlugs)

  const { data: release, error } = await supabase
    .from('shippulse_releases')
    .insert({
      project_id: projectId,
      workspace_id: project.workspace_id,
      title,
      slug,
      summary: summary ?? null,
      content: content ?? null,
      version: version ?? null,
      status,
      published_at: status === 'published' ? (publishedAt ?? new Date().toISOString()) : null,
      tags: tags ?? [],
      cta_text: ctaText ?? null,
      cta_url: ctaUrl ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create release.' }, { status: 500 })
  }

  return NextResponse.json({ data: release }, { status: 201 })
}
