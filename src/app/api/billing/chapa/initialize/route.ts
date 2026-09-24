// ============================================================
// POST /api/billing/chapa/initialize
// Starts a Chapa checkout transaction for Pro or Team plan
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { initializeChapaPayment } from '@/lib/billing/chapa'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { projectSlug, plan = 'pro' } = body

    if (!['pro', 'team'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }

    const serviceDb = createServiceClient()

    // 1. Resolve workspace and project
    let workspaceId: string | null = null
    let resolvedSlug = projectSlug || 'dashboard'

    if (projectSlug) {
      const { data: project } = await serviceDb
        .from('shippulse_projects')
        .select('workspace_id, slug')
        .eq('slug', projectSlug)
        .is('deleted_at', null)
        .maybeSingle()

      if (project) {
        workspaceId = project.workspace_id
        resolvedSlug = project.slug
      }
    }

    if (!workspaceId) {
      const { data: membership } = await serviceDb
        .from('shippulse_memberships')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      workspaceId = membership?.workspace_id ?? null
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

    const result = await initializeChapaPayment({
      workspaceId,
      projectSlug: resolvedSlug,
      plan,
      email: user.email || 'customer@shippulse.app',
      name: user.user_metadata?.full_name || user.user_metadata?.name || 'ShipPulse User',
      appUrl,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to initialize Chapa payment' }, { status: 502 })
    }

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      txRef: result.txRef,
      provider: 'chapa',
    })
  } catch (err: any) {
    console.error('[API /api/billing/chapa/initialize] Error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
