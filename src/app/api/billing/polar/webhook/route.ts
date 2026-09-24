// ============================================================
// POST /api/billing/polar/webhook
// Ingress webhook for Polar.sh subscription and order events
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyPolarWebhookSignature } from '@/lib/billing/polar'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('webhook-signature') || request.headers.get('x-polar-signature')
    const secret = process.env.POLAR_WEBHOOK_SECRET

    // If live webhook secret is configured, verify HMAC signature
    if (secret && !secret.includes('placeholder')) {
      const isValid = verifyPolarWebhookSignature(rawBody, signature, secret)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
      }
    }

    const payload = JSON.parse(rawBody || '{}')
    const eventType = payload.type || payload.event

    console.log(`[Polar Webhook] Received event: ${eventType}`)

    const data = payload.data || payload

    // Extract metadata
    const metadata = data.metadata || data.custom_field_data || {}
    const workspaceId = metadata.workspace_id
    const targetPlan = metadata.plan === 'team' ? 'team' : 'pro'

    const serviceDb = createServiceClient()

    if (workspaceId) {
      if (
        eventType === 'subscription.created' ||
        eventType === 'subscription.active' ||
        eventType === 'subscription.updated' ||
        eventType === 'order.created' ||
        eventType === 'checkout.created'
      ) {
        await serviceDb
          .from('shippulse_workspaces')
          .update({
            plan: targetPlan,
            billing_customer_id: data.customer_id || data.customer?.id,
            billing_subscription_id: data.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', workspaceId)

        console.log(`[Polar Webhook] Workspace ${workspaceId} activated plan ${targetPlan}`)
      } else if (eventType === 'subscription.canceled' || eventType === 'subscription.revoked') {
        await serviceDb
          .from('shippulse_workspaces')
          .update({
            plan: 'free',
            updated_at: new Date().toISOString(),
          })
          .eq('id', workspaceId)

        console.log(`[Polar Webhook] Workspace ${workspaceId} downgraded to free on cancellation`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[API /api/billing/polar/webhook] Error:', err.message)
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 })
  }
}
