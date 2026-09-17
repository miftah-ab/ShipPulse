// ============================================================
// POST /api/github/webhook
// Receives GitHub webhook events, validates signature,
// enforces idempotency, triggers sync
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { validateWebhookSignature } from '@/lib/github/service'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, getIdentifier, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()

  // ── Rate limiting ────────────────────────────────────────
  const identifier = getIdentifier(request)
  const rateLimit = await checkRateLimit(supabase, {
    identifier,
    endpoint: 'github_webhook',
    limitPerMinute: RATE_LIMITS.webhook,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // ── Required headers ─────────────────────────────────────
  const deliveryId = request.headers.get('x-github-delivery')
  const eventType  = request.headers.get('x-github-event')
  const signature  = request.headers.get('x-hub-signature-256')

  if (!deliveryId || !eventType || !signature) {
    return NextResponse.json({ error: 'Missing required webhook headers' }, { status: 400 })
  }

  // ── Idempotency: reject duplicate deliveries ──────────────
  const { data: existing } = await supabase
    .from('shippulse_webhook_events_incoming')
    .select('id, processed')
    .eq('delivery_id', deliveryId)
    .maybeSingle()

  if (existing) {
    // Already processed (or duplicate)  -  acknowledge but do nothing
    return NextResponse.json({ status: 'already_processed' }, { status: 200 })
  }

  // ── Read raw body for signature verification ──────────────
  const rawBody = await request.text()

  // ── Find matching repository connection by repo info ─────
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const repoId = (payload.repository as any)?.id
  if (!repoId) {
    return NextResponse.json({ error: 'No repository in payload' }, { status: 400 })
  }

  // Find the repository in our system
  const { data: repo } = await supabase
    .from('shippulse_repositories')
    .select('id')
    .eq('github_repo_id', repoId)
    .maybeSingle()

  // Find the repository connection to get the webhook secret
  const { data: connection } = await supabase
    .from('shippulse_repository_connections')
    .select('webhook_secret, project_id')
    .eq('repository_id', repo?.id ?? '')
    .maybeSingle()

  const webhookSecret = connection?.webhook_secret ?? process.env.GITHUB_WEBHOOK_SECRET

  // ── Validate HMAC signature ───────────────────────────────
  if (!webhookSecret) {
    // Log and reject  -  never accept unsigned webhooks
    console.error('[Webhook] No webhook secret configured for repo:', repoId)
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })
  }

  const isValid = validateWebhookSignature(rawBody, signature, webhookSecret)

  // ── Record the event regardless of validity ───────────────
  await supabase.from('shippulse_webhook_events_incoming').insert({
    delivery_id:    deliveryId,
    event_type:     eventType,
    repository_id:  repo?.id ?? null,
    payload,
    signature_valid: isValid,
    processed:      false,
  })

  if (!isValid) {
    console.warn('[Webhook] Invalid signature for delivery:', deliveryId)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // ── Dispatch to background processing ────────────────────
  // We acknowledge immediately and process async to avoid GitHub timeouts
  processWebhookAsync(deliveryId, eventType, payload, repo?.id, connection?.project_id)
    .catch((err) => {
      console.error('[Webhook] Async processing failed:', deliveryId, err instanceof Error ? err.message : err)
    })

  return NextResponse.json({ status: 'received' }, { status: 200 })
}

async function processWebhookAsync(
  deliveryId: string,
  eventType: string,
  payload: Record<string, unknown>,
  repositoryId: string | undefined,
  projectId: string | undefined
): Promise<void> {
  const supabase = createServiceClient()

  try {
    if (eventType === 'push') {
      await handlePushEvent(supabase, payload, repositoryId, projectId)
    } else if (eventType === 'pull_request') {
      await handlePullRequestEvent(supabase, payload, repositoryId, projectId)
    } else if (eventType === 'release') {
      await handleReleaseEvent(supabase, payload, repositoryId, projectId)
    }

    // Mark as processed
    await supabase
      .from('shippulse_webhook_events_incoming')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('delivery_id', deliveryId)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await supabase
      .from('shippulse_webhook_events_incoming')
      .update({ error: message })
      .eq('delivery_id', deliveryId)
    throw err
  }
}

async function handlePushEvent(
  supabase: ReturnType<typeof createServiceClient>,
  payload: Record<string, unknown>,
  repositoryId: string | undefined,
  projectId: string | undefined
): Promise<void> {
  if (!repositoryId || !projectId) return

  const commits = (payload.commits as any[]) ?? []
  if (commits.length === 0) return

  // Get workspace_id
  const { data: project } = await supabase
    .from('shippulse_projects')
    .select('workspace_id')
    .eq('id', projectId)
    .single()

  if (!project) return

  // Queue a sync job
  await supabase.from('shippulse_sync_jobs').insert({
    project_id: projectId,
    repository_id: repositoryId,
    workspace_id: project.workspace_id,
    status: 'queued',
    triggered_by: 'webhook',
  })
}

async function handlePullRequestEvent(
  supabase: ReturnType<typeof createServiceClient>,
  payload: Record<string, unknown>,
  repositoryId: string | undefined,
  projectId: string | undefined
): Promise<void> {
  if (!repositoryId || !projectId) return

  const action = payload.action as string
  const pr = payload.pull_request as any

  // Only care about merged PRs
  if (action !== 'closed' || !pr?.merged) return

  const { data: project } = await supabase
    .from('shippulse_projects')
    .select('workspace_id')
    .eq('id', projectId)
    .single()

  if (!project) return

  await supabase.from('shippulse_sync_jobs').insert({
    project_id: projectId,
    repository_id: repositoryId,
    workspace_id: project.workspace_id,
    status: 'queued',
    triggered_by: 'webhook',
  })
}

async function handleReleaseEvent(
  supabase: ReturnType<typeof createServiceClient>,
  payload: Record<string, unknown>,
  repositoryId: string | undefined,
  projectId: string | undefined
): Promise<void> {
  if (!repositoryId || !projectId) return

  const action = payload.action as string
  if (action !== 'published') return

  const { data: project } = await supabase
    .from('shippulse_projects')
    .select('workspace_id, auto_publish_enabled, auto_publish_config')
    .eq('id', projectId)
    .single()

  if (!project) return

  // Queue sync job
  await supabase.from('shippulse_sync_jobs').insert({
    project_id: projectId,
    repository_id: repositoryId,
    workspace_id: project.workspace_id,
    status: 'queued',
    triggered_by: 'webhook',
  })
}
