// ============================================================
// POST /api/public/subscribe
// Subscribe to a project's changelog  -  rate limited, confirmation required
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendSubscriberConfirmation } from '@/lib/email/resend'
import { checkRateLimit, getIdentifier, RATE_LIMITS } from '@/lib/rate-limit'
import { createHash } from 'crypto'
import { z } from 'zod'

const SubscribeSchema = z.object({
  projectSlug: z.string().min(1).max(50),
  email: z.string().email().max(254),
  name: z.string().max(100).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()

  // Rate limit
  const identifier = getIdentifier(request)
  const rateLimit = await checkRateLimit(supabase, {
    identifier,
    endpoint: 'subscribe',
    limitPerMinute: RATE_LIMITS.subscribe,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many subscription attempts. Please wait a minute.' },
      { status: 429 }
    )
  }

  // Parse and validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = SubscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { projectSlug, email, name } = parsed.data

  // Lookup public project
  const { data: project } = await supabase
    .from('shippulse_projects')
    .select('id, name, show_subscribe')
    .eq('slug', projectSlug)
    .eq('is_public', true)
    .is('deleted_at', null)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (!project.show_subscribe) {
    return NextResponse.json({ error: 'Subscriptions are not enabled for this project' }, { status: 403 })
  }

  // Hash IP for spam detection
  const ipHash = createHash('sha256')
    .update(identifier + (process.env.APP_SECRET ?? ''))
    .digest('hex')
    .slice(0, 16)

  // Upsert subscriber (idempotent  -  same email same project = update)
  const { data: subscriber, error } = await supabase
    .from('shippulse_subscribers')
    .upsert(
      {
        project_id: project.id,
        email: email.toLowerCase(),
        name: name ?? null,
        status: 'pending',
        source: 'changelog',
        ip_hash: ipHash,
      },
      {
        onConflict: 'project_id,email',
        ignoreDuplicates: false,
      }
    )
    .select('id, status, confirm_token, confirmed_at')
    .single()

  if (error) {
    console.error('[Subscribe] DB error:', error.message)
    return NextResponse.json({ error: 'Failed to process subscription' }, { status: 500 })
  }

  // Already confirmed  -  don't resend
  if (subscriber.confirmed_at) {
    return NextResponse.json({ status: 'already_subscribed' })
  }

  // Send confirmation email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ship-pulse.vercel.app'
  const confirmUrl = `${appUrl}/api/public/confirm?token=${subscriber.confirm_token}`
  const unsubscribeUrl = `${appUrl}/api/public/unsubscribe?token=${subscriber.confirm_token}`

  try {
    await sendSubscriberConfirmation({
      to: email,
      confirmUrl,
      projectName: project.name,
      unsubscribeUrl,
    })
  } catch (emailErr) {
    if (emailErr instanceof Error && emailErr.name === 'EmailNotConfiguredError') {
      // Email not configured  -  auto-confirm in development
      if (process.env.NODE_ENV === 'development') {
        await supabase
          .from('shippulse_subscribers')
          .update({ status: 'active', confirmed_at: new Date().toISOString() })
          .eq('id', subscriber.id)
        return NextResponse.json({ status: 'subscribed', note: 'Auto-confirmed (email not configured)' })
      }
      return NextResponse.json(
        { error: 'Email confirmation is not available. Please contact the project owner.' },
        { status: 503 }
      )
    }
    console.error('[Subscribe] Email send failed:', emailErr instanceof Error ? emailErr.message : emailErr)
    return NextResponse.json({ error: 'Failed to send confirmation email' }, { status: 500 })
  }

  return NextResponse.json({ status: 'confirmation_sent' })
}
