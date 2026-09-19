// ============================================================
// GET /api/github/repos
// Lists repositories accessible to the user via GitHub OAuth
// Like Vercel / Railway repository import picker
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    // Fetch live repositories from GitHub via OAuth token
    const { data: { session } } = await supabase.auth.getSession()
    const providerToken = session?.provider_token

    if (!providerToken) {
      // No GitHub OAuth token — return empty list; user needs to connect GitHub
      return NextResponse.json({
        repositories: [],
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
