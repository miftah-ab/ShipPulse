// ============================================================
// POST /api/public/feedback
// Submit feedback on a release — rate limited, spam-resistant
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, getIdentifier, RATE_LIMITS } from '@/lib/rate-limit'
import { createHash } from 'crypto'
import { z } from 'zod'

const FeedbackSchema = z.object({
  projectSlug: z.string().min(1).max(50),
  releaseSlug: z.string().min(1).max(100),
  type: z.enum(['helpful', 'not_helpful', 'reaction', 'comment', 'submission']),
  reaction: z.string().max(20).optional(),
  content: z.string().max(2000).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()

  // Rate limit
  const identifier = getIdentifier(request)
  const rateLimit = await checkRateLimit(supabase, {
    identifier,
    endpoint: 'feedback',
    limitPerMinute: RATE_LIMITS.feedback,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before submitting more feedback.' },
      { status: 429 }
    )
  }

  // Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = FeedbackSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { projectSlug, releaseSlug, type, reaction, content } = parsed.data

  // Validate content for comment/submission types
  if ((type === 'comment' || type === 'submission') && !content?.trim()) {
    return NextResponse.json({ error: 'Content is required for comments.' }, { status: 400 })
  }

  // Lookup project
  const { data: project } = await supabase
    .from('shippulse_projects')
    .select('id')
    .eq('slug', projectSlug)
    .eq('is_public', true)
    .is('deleted_at', null)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Lookup published release
  const { data: release } = await supabase
    .from('shippulse_releases')
    .select('id')
    .eq('project_id', project.id)
    .eq('slug', releaseSlug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single()

  if (!release) {
    return NextResponse.json({ error: 'Release not found' }, { status: 404 })
  }

  // Hash visitor and IP for spam detection (no PII stored)
  const visitorHash = createHash('sha256')
    .update(identifier + (process.env.APP_SECRET ?? ''))
    .digest('hex')
    .slice(0, 16)

  const ipHash = createHash('sha256')
    .update(identifier)
    .digest('hex')
    .slice(0, 16)

  // Basic spam detection — prevent duplicate helpful/not_helpful from same visitor
  if (type === 'helpful' || type === 'not_helpful') {
    const { count } = await supabase
      .from('shippulse_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('release_id', release.id)
      .eq('visitor_hash', visitorHash)
      .in('type', ['helpful', 'not_helpful'])

    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: 'You have already voted on this release.' }, { status: 409 })
    }
  }

  // Insert feedback
  const { error } = await supabase.from('shippulse_feedback').insert({
    project_id: project.id,
    release_id: release.id,
    visitor_hash: visitorHash,
    type,
    reaction: reaction ?? null,
    content: content ? sanitizeFeedbackContent(content) : null,
    is_spam: false,
    is_approved: true,
    ip_hash: ipHash,
  })

  if (error) {
    console.error('[Feedback] DB insert error:', error.message)
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
  }

  // Update release feedback count (non-blocking)
  supabase.rpc('shippulse_increment_feedback_count', { release_id: release.id })
    .then(() => {})

  return NextResponse.json({ status: 'received' })
}

function sanitizeFeedbackContent(content: string): string {
  // Strip HTML tags, normalize whitespace
  return content
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000)
}
