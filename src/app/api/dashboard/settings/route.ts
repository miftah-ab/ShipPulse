// ============================================================
// PATCH /api/dashboard/settings
// Save project general settings, domain, widget config
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { projectSlug, name, customDomain, accentColor } = body

    if (!projectSlug) return NextResponse.json({ error: 'projectSlug is required' }, { status: 400 })

    const serviceDb = createServiceClient()

    const { data: project } = await serviceDb
      .from('shippulse_projects')
      .select('id, workspace_id')
      .eq('slug', projectSlug)
      .is('deleted_at', null)
      .maybeSingle()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const { data: membership } = await serviceDb
      .from('shippulse_memberships')
      .select('role')
      .eq('workspace_id', project.workspace_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const updates: any = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name
    if (customDomain !== undefined) updates.custom_domain = customDomain
    if (accentColor !== undefined) updates.accent_color = accentColor

    const { data: updated, error } = await serviceDb
      .from('shippulse_projects')
      .update(updates)
      .eq('id', project.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ project: updated })
  } catch (err: any) {
    console.error('[Settings API] Error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
