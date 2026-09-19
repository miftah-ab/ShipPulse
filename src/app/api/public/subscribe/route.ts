// ============================================================
// POST /api/public/react — record an emoji reaction on a release
// GET  /api/public/subscribe?projectSlug=...&list=true
// POST /api/public/subscribe — add subscriber to project
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // Used by the dashboard subscribers page to list subscribers
  const { searchParams } = new URL(request.url)
  const projectSlug = searchParams.get('projectSlug')
  const list = searchParams.get('list')

  if (!projectSlug || list !== 'true') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const serviceDb = createServiceClient()

  const { data: project } = await serviceDb
    .from('shippulse_projects')
    .select('id')
    .eq('slug', projectSlug)
    .is('deleted_at', null)
    .maybeSingle()

  if (!project) {
    return NextResponse.json({ subscribers: [] })
  }

  const { data: subs } = await serviceDb
    .from('shippulse_subscribers')
    .select('id, email, status, confirmed_at, created_at')
    .eq('project_id', project.id)
    .is('unsubscribed_at', null)
    .order('created_at', { ascending: false })

  return NextResponse.json({
    subscribers: (subs ?? []).map((s) => ({
      id: s.id,
      email: s.email,
      status: s.status || 'pending',
      joinedAt: new Date(s.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      releasesSent: 0,
    })),
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, projectSlug } = body

    if (!email || !projectSlug) {
      return NextResponse.json({ error: 'email and projectSlug are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const serviceDb = createServiceClient()

    const { data: project } = await serviceDb
      .from('shippulse_projects')
      .select('id')
      .eq('slug', projectSlug)
      .eq('is_public', true)
      .is('deleted_at', null)
      .maybeSingle()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const { error } = await serviceDb
      .from('shippulse_subscribers')
      .upsert(
        {
          project_id: project.id,
          email: email.toLowerCase().trim(),
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        },
        { onConflict: 'project_id,email', ignoreDuplicates: false }
      )

    if (error) {
      console.error('[Subscribe] Error:', error.message)
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Subscribed successfully!' })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
