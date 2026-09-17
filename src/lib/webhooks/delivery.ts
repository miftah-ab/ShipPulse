// ============================================================
// ShipPulse — Outgoing Webhook Delivery Service
// Signs payloads with HMAC-SHA256, handles retries
// ============================================================

import { createHmac } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

export type WebhookEventType =
  | 'release.published'
  | 'release.updated'
  | 'release.deleted'
  | 'feedback.created'
  | 'subscriber.created'

export interface WebhookPayload {
  event: WebhookEventType
  timestamp: string
  project_id: string
  data: Record<string, unknown>
}

/**
 * Deliver a webhook event to all active endpoints configured for this project.
 * Signs each request with the endpoint's secret.
 * Records delivery and schedules retry on failure.
 */
export async function deliverWebhookEvent(
  projectId: string,
  eventType: WebhookEventType,
  data: Record<string, unknown>
): Promise<void> {
  const supabase = createServiceClient()

  // Fetch active endpoints for this project that subscribe to this event
  const { data: endpoints, error } = await supabase
    .from('shippulse_webhook_endpoints')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_active', true)
    .contains('events', [eventType])

  if (error || !endpoints?.length) return

  const payload: WebhookPayload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    project_id: projectId,
    data,
  }

  const payloadStr = JSON.stringify(payload)

  // Deliver to each endpoint in parallel (up to 5 concurrent)
  await Promise.allSettled(
    endpoints.map((endpoint) => deliverToEndpoint(supabase, endpoint, payload, payloadStr))
  )
}

async function deliverToEndpoint(
  supabase: ReturnType<typeof createServiceClient>,
  endpoint: { id: string; url: string; secret: string },
  payload: WebhookPayload,
  payloadStr: string
): Promise<void> {
  const signature = signPayload(payloadStr, endpoint.secret)
  const eventId = crypto.randomUUID()

  // Record delivery attempt
  const { data: delivery } = await supabase
    .from('shippulse_webhook_deliveries')
    .insert({
      endpoint_id: endpoint.id,
      event_type: payload.event,
      payload,
      attempt_count: 1,
    })
    .select('id')
    .single()

  const deliveryId = delivery?.id

  try {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ShipPulse-Event': payload.event,
        'X-ShipPulse-Delivery': eventId,
        'X-ShipPulse-Signature-256': `sha256=${signature}`,
        'X-ShipPulse-Timestamp': payload.timestamp,
        'User-Agent': 'ShipPulse-Webhook/1.0',
      },
      body: payloadStr,
      signal: AbortSignal.timeout(30_000),
    })

    const responseBody = await response.text().catch(() => '')

    if (deliveryId) {
      await supabase
        .from('shippulse_webhook_deliveries')
        .update({
          status_code: response.status,
          response_body: responseBody.slice(0, 1000),
          delivered_at: response.ok ? new Date().toISOString() : null,
          failed_at: response.ok ? null : new Date().toISOString(),
          error: response.ok ? null : `HTTP ${response.status}`,
          // Schedule retry if failed and < 3 attempts
          next_retry_at: !response.ok
            ? new Date(Date.now() + 5 * 60 * 1000).toISOString()  // 5 min retry
            : null,
        })
        .eq('id', deliveryId)
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)

    if (deliveryId) {
      await supabase
        .from('shippulse_webhook_deliveries')
        .update({
          failed_at: new Date().toISOString(),
          error: errorMessage,
          next_retry_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        })
        .eq('id', deliveryId)
    }

    console.error('[Webhook] Delivery failed:', {
      endpointId: endpoint.id,
      event: payload.event,
      error: errorMessage,
    })
  }
}

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Retry failed webhook deliveries (called by cron job)
 */
export async function retryFailedDeliveries(): Promise<{ retried: number; failed: number }> {
  const supabase = createServiceClient()
  let retried = 0
  let failed = 0

  const { data: pending } = await supabase
    .from('shippulse_webhook_deliveries')
    .select(`*, shippulse_webhook_endpoints(url, secret, is_active, events)`)
    .lte('next_retry_at', new Date().toISOString())
    .lt('attempt_count', 3)
    .is('delivered_at', null)
    .limit(50)

  if (!pending?.length) return { retried: 0, failed: 0 }

  for (const delivery of pending) {
    const endpoint = delivery.shippulse_webhook_endpoints as any
    if (!endpoint?.is_active) continue

    const payloadStr = JSON.stringify(delivery.payload)
    const signature = signPayload(payloadStr, endpoint.secret)
    const eventId = crypto.randomUUID()

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ShipPulse-Event': delivery.event_type,
          'X-ShipPulse-Delivery': eventId,
          'X-ShipPulse-Signature-256': `sha256=${signature}`,
          'User-Agent': 'ShipPulse-Webhook/1.0',
        },
        body: payloadStr,
        signal: AbortSignal.timeout(30_000),
      })

      await supabase
        .from('shippulse_webhook_deliveries')
        .update({
          status_code: response.status,
          attempt_count: delivery.attempt_count + 1,
          delivered_at: response.ok ? new Date().toISOString() : null,
          failed_at: response.ok ? null : new Date().toISOString(),
          next_retry_at: null,
          error: response.ok ? null : `HTTP ${response.status}`,
        })
        .eq('id', delivery.id)

      response.ok ? retried++ : failed++
    } catch (err) {
      await supabase
        .from('shippulse_webhook_deliveries')
        .update({
          attempt_count: delivery.attempt_count + 1,
          failed_at: new Date().toISOString(),
          error: err instanceof Error ? err.message : String(err),
          // Exponential backoff: 5min, 30min, then give up
          next_retry_at: delivery.attempt_count >= 2
            ? null
            : new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        })
        .eq('id', delivery.id)

      failed++
    }
  }

  return { retried, failed }
}
