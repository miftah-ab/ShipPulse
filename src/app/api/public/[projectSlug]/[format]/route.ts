// ============================================================
// GET /[projectSlug]/feed.xml  — RSS 2.0
// GET /[projectSlug]/atom.xml  — Atom 1.0
// Public changelog feeds — auto-updated on publish
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateRSSFeed, generateAtomFeed } from '@/lib/feeds'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectSlug: string; format: string }> }
) {
  const { projectSlug, format } = await params
  const isAtom = format === 'atom.xml'
  const supabase = createServiceClient()

  const { data: project } = await supabase
    .from('shippulse_projects')
    .select('id, name, description, default_language, slug')
    .eq('slug', projectSlug)
    .eq('is_public', true)
    .not('search_visibility', 'eq', 'private')
    .is('deleted_at', null)
    .single()

  if (!project) {
    return new NextResponse('Feed not found', { status: 404 })
  }

  const { data: releases } = await supabase
    .from('shippulse_releases')
    .select('id, title, slug, summary, content_html, published_at, shippulse_categories(label)')
    .eq('project_id', project.id)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(50)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://shippulse.vercel.app'
  const changelogUrl = `${appUrl}/${project.slug}`
  const feedUrl = `${appUrl}/${project.slug}/${format}`

  const items = (releases ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    summary: r.summary ?? '',
    content: r.content_html ?? r.summary ?? '',
    url: `${changelogUrl}/${r.slug}`,
    publishedAt: r.published_at ?? new Date().toISOString(),
    category: (r.shippulse_categories as any)?.label,
  }))

  const feedConfig = {
    title: `${project.name} Changelog`,
    description: project.description ?? `Updates from ${project.name}`,
    url: changelogUrl,
    feedUrl,
    language: project.default_language,
    items,
  }

  const feedContent = isAtom
    ? generateAtomFeed(feedConfig)
    : generateRSSFeed(feedConfig)

  return new NextResponse(feedContent, {
    headers: {
      'Content-Type': isAtom ? 'application/atom+xml' : 'application/rss+xml',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
