// ============================================================
// POST /api/public/react — record emoji reaction on a release
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { releaseId, emoji } = body

    if (!releaseId || !emoji) {
      return NextResponse.json({ error: 'releaseId and emoji are required' }, { status: 400 })
    }

    const serviceDb = createServiceClient()

    // Upsert reaction
    await serviceDb
      .from('shippulse_reactions')
      .upsert(
        { release_id: releaseId, emoji, count: 1 },
        { onConflict: 'release_id,emoji' }
      )

    // Increment the reactions_count on the release
    await serviceDb.rpc('increment_release_reactions', { p_release_id: releaseId })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[React API] Error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const releaseId = searchParams.get('releaseId')

  if (!releaseId) return NextResponse.json({ reactions: {} })

  const serviceDb = createServiceClient()
  const { data } = await serviceDb
    .from('shippulse_reactions')
    .select('emoji, count')
    .eq('release_id', releaseId)

  const reactionMap: Record<string, number> = {}
  for (const r of data ?? []) {
    reactionMap[r.emoji] = r.count ?? 0
  }

  return NextResponse.json({ reactions: reactionMap })
}
