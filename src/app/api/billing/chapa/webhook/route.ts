// ============================================================
// POST /api/billing/chapa/webhook
// Ingress webhook for Chapa transaction event notifications
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyChapaPayment } from '@/lib/billing/chapa'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const txRef = body?.tx_ref || body?.data?.tx_ref

    if (!txRef) {
      return NextResponse.json({ received: true, ignored: 'Missing tx_ref' })
    }

    // Verify transaction with Chapa
    const verification = await verifyChapaPayment(txRef)

    if (verification.success && verification.status === 'success') {
      const parts = txRef.split('-')
      const plan = (parts[2] === 'team' ? 'team' : 'pro') as 'pro' | 'team'
      const wsPrefix = parts[1]

      const serviceDb = createServiceClient()

      // Find workspace by ID prefix or billing_customer_id
      const { data: workspaces } = await serviceDb
        .from('shippulse_workspaces')
        .select('id')

      const matchedWorkspace = (workspaces || []).find((w) => w.id.startsWith(wsPrefix))

      if (matchedWorkspace) {
        await serviceDb
          .from('shippulse_workspaces')
          .update({
            plan,
            billing_customer_id: txRef,
            updated_at: new Date().toISOString(),
          })
          .eq('id', matchedWorkspace.id)

        console.log(`[Chapa Webhook] Upgraded workspace ${matchedWorkspace.id} to ${plan}`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[API /api/billing/chapa/webhook] Error:', err.message)
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 })
  }
}
