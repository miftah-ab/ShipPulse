// ============================================================
// GET /api/billing/chapa/verify
// Verifies transaction with Chapa and activates plan on workspace
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { verifyChapaPayment } from '@/lib/billing/chapa'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const txRef = searchParams.get('tx_ref')

    if (!txRef) {
      return NextResponse.json({ error: 'tx_ref is required' }, { status: 400 })
    }

    const verification = await verifyChapaPayment(txRef)

    if (!verification.success) {
      return NextResponse.json({ error: verification.error || 'Payment not verified' }, { status: 400 })
    }

    // Parse workspace ID and plan from txRef: SP-{wsPrefix}-{plan}-{timestamp}
    const parts = txRef.split('-')
    const plan = (parts[2] === 'team' ? 'team' : 'pro') as 'pro' | 'team'

    const serviceDb = createServiceClient()

    // Find the user's workspace
    const { data: membership } = await serviceDb
      .from('shippulse_memberships')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (membership?.workspace_id) {
      await serviceDb
        .from('shippulse_workspaces')
        .update({
          plan,
          billing_customer_id: txRef,
          updated_at: new Date().toISOString(),
        })
        .eq('id', membership.workspace_id)

      console.log(`[Chapa Verify] Workspace ${membership.workspace_id} upgraded to ${plan}`)
    }

    return NextResponse.json({
      success: true,
      plan,
      txRef,
      status: 'activated',
    })
  } catch (err: any) {
    console.error('[API /api/billing/chapa/verify] Error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
