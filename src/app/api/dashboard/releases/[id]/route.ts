// ============================================================
// GET, PATCH, DELETE /api/dashboard/releases/[id]
// Authenticated management for a specific release
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const serviceDb = createServiceClient()

    const { data: release, error } = await serviceDb
      .from('shippulse_releases')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle()

    if (error || !release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 })
    }

    return NextResponse.json({ release })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { title, version, content, status, tags } = body

    const serviceDb = createServiceClient()

    const updateData: any = { updated_at: new Date().toISOString() }
    if (title !== undefined) updateData.title = title
    if (version !== undefined) updateData.version = version
    if (content !== undefined) {
      updateData.content = content
      updateData.summary = content.slice(0, 200)
    }
    if (status !== undefined) {
      updateData.status = status
      if (status === 'published') {
        updateData.published_at = new Date().toISOString()
      }
    }
    if (tags !== undefined) updateData.tags = tags

    const { data: release, error } = await serviceDb
      .from('shippulse_releases')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update release' }, { status: 500 })
    }

    return NextResponse.json({ release })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const serviceDb = createServiceClient()

    const { error } = await serviceDb
      .from('shippulse_releases')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete release' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
