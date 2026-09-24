// ============================================================
// POST /api/billing/polar/checkout
// Creates a Polar.sh checkout session for Pro or Team plan
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createPolarCheckout } from '@/lib/billing/polar'

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

    const checkout = await createPolarCheckout({
      workspaceId,
      projectSlug: resolvedSlug,
      plan,
      email: user.email || 'customer@shippulse.app',
      appUrl,
    })

    if (!checkout.success) {
      return NextResponse.json({ error: checkout.error || 'Failed to initialize Polar checkout' }, { status: 502 })
    }

    return NextResponse.json({
      checkoutUrl: checkout.checkoutUrl,
      checkoutId: checkout.checkoutId,
      provider: 'polar',
    })
  } catch (err: any) {
    console.error('[API /api/billing/polar/checkout] Error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
