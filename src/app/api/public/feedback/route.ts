// ============================================================
// GET /api/public/feedback?projectSlug=...
// Public endpoint to list submitted feedback for a project
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get('projectSlug')

    if (!projectSlug) {
      return NextResponse.json({ error: 'projectSlug is required' }, { status: 400 })
    }

    const serviceDb = createServiceClient()

    const { data: project } = await serviceDb
      .from('shippulse_projects')
      .select('id')
      .eq('slug', projectSlug)
      .is('deleted_at', null)
      .maybeSingle()

    if (!project) {
      return NextResponse.json({ feedback: [] })
    }

    const { data: feedback } = await serviceDb
      .from('shippulse_feedback')
      .select('id, text, rating, reaction, created_at, shippulse_releases(version, title)')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
      .limit(100)

    return NextResponse.json({
      feedback: (feedback ?? []).map((f: any) => ({
        id: f.id,
        text: f.text || '',
        rating: f.rating || null,
        reaction: f.reaction || null,
        releaseVersion: f.shippulse_releases?.version || null,
        releaseTitle: f.shippulse_releases?.title || null,
        createdAt: new Date(f.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      })),
    })
  } catch (err: any) {
    console.error('[Feedback API] Error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectSlug, releaseId, text, rating, reaction } = body

    if (!projectSlug) {
      return NextResponse.json({ error: 'projectSlug is required' }, { status: 400 })
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
      .from('shippulse_feedback')
      .insert({
        project_id: project.id,
        release_id: releaseId || null,
        text: text || null,
        rating: rating || null,
        reaction: reaction || null,
      })

    if (error) {
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
