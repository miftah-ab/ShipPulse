// ============================================================
// GET /api/dashboard/api-keys?projectSlug=...
// POST /api/dashboard/api-keys
// DELETE /api/dashboard/api-keys?id=...
// Real API key management per project
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get('projectSlug')
    if (!projectSlug) return NextResponse.json({ error: 'projectSlug is required' }, { status: 400 })

    const serviceDb = createServiceClient()

    const { data: project } = await serviceDb
      .from('shippulse_projects')
      .select('id, workspace_id')
      .eq('slug', projectSlug)
      .is('deleted_at', null)
      .maybeSingle()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const { data: keys } = await serviceDb
      .from('shippulse_api_keys')
      .select('id, name, key_prefix, scopes, created_at, last_used_at')
      .eq('project_id', project.id)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      keys: (keys ?? []).map((k) => ({
        id: k.id,
        name: k.name,
        maskedKey: `sp_live_${k.key_prefix}...`,
        scopes: k.scopes ?? [],
        createdAt: k.created_at,
        lastUsedAt: k.last_used_at,
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { projectSlug, name, scopes } = body

    const serviceDb = createServiceClient()

    const { data: project } = await serviceDb
      .from('shippulse_projects')
      .select('id, workspace_id')
      .eq('slug', projectSlug)
      .is('deleted_at', null)
      .maybeSingle()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const rawKey = `sp_live_${crypto.randomBytes(24).toString('hex')}`
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
    const keyPrefix = rawKey.slice(8, 16)

    const { data: keyRecord, error } = await serviceDb
      .from('shippulse_api_keys')
      .insert({
        workspace_id: project.workspace_id,
        project_id: project.id,
        user_id: user.id,
        name: name || 'API Key',
        key_hash: keyHash,
        key_prefix: keyPrefix,
        scopes: scopes ?? ['releases:read'],
      })
      .select('id, name, key_prefix, scopes, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
    }

    return NextResponse.json({
      key: {
        id: keyRecord.id,
        name: keyRecord.name,
        maskedKey: `sp_live_${keyRecord.key_prefix}...`,
        scopes: keyRecord.scopes,
        rawKey, // shown only once
        createdAt: keyRecord.created_at,
      },
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const serviceDb = createServiceClient()
    await serviceDb
      .from('shippulse_api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
