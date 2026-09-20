// ============================================================
// GET /api/github/repos
// Lists repositories accessible to the user via GitHub OAuth
// Like Vercel / Railway repository import picker
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createGitHubClient, listUserRepositories } from '@/lib/github/service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase() || ''

    // ── Fetch the persisted GitHub token from the database ───────
    // Supabase only exposes provider_token immediately after OAuth exchange.
    // We stored it in shippulse_users.github_access_token at callback time.
    const serviceClient = createServiceClient()
    const { data: userRow, error: userErr } = await serviceClient
      .from('shippulse_users')
      .select('github_access_token')
      .eq('id', user.id)
      .single()

    if (userErr) {
      console.error('[GitHub Repos] DB error fetching token:', userErr.message)
    }

    const providerToken = userRow?.github_access_token ?? null

    if (!providerToken) {
      // No GitHub OAuth token — user needs to re-connect GitHub
      return NextResponse.json({
        repositories: [],
        needsConnect: true,
        connectUrl: '/api/github/connect',
        message: 'Connect your GitHub account to import repositories.',
      })
    }

    try {
      const client = createGitHubClient(providerToken)
      let repos = await listUserRepositories(client, { perPage: 100 })

      if (query) {
        repos = repos.filter(
          (r) =>
            r.name.toLowerCase().includes(query) ||
            r.fullName.toLowerCase().includes(query) ||
            (r.description || '').toLowerCase().includes(query)
        )
      }

      return NextResponse.json({
        repositories: repos.map((r) => ({
          id: r.id,
          name: r.name,
          fullName: r.fullName,
          owner: r.owner,
          description: r.description || '',
          isPrivate: r.isPrivate,
          defaultBranch: r.defaultBranch,
          updatedAt: r.updatedAt,
          url: r.url,
        })),
      })
    } catch (err: any) {
      console.error('[GitHub Repos] Error fetching repositories:', err.message)

      // If 401 — token is revoked/expired; clear it so UI shows reconnect
      if (err.status === 401) {
        await serviceClient
          .from('shippulse_users')
          .update({ github_access_token: null, github_token_updated: new Date().toISOString() })
          .eq('id', user.id)

        return NextResponse.json({
          repositories: [],
          needsConnect: true,
          connectUrl: '/api/github/connect',
          message: 'Your GitHub connection has expired. Please re-connect.',
        })
      }

      return NextResponse.json(
        { error: 'Failed to fetch repositories from GitHub. Please re-connect your account.' },
        { status: 502 }
      )
    }
  } catch (err: any) {
    console.error('[API /api/github/repos] Error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
