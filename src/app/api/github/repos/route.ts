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

    // ── Fetch user row from DB ───────────────────────────────────
    const serviceClient = createServiceClient()
    const { data: userRow, error: userErr } = await serviceClient
      .from('shippulse_users')
      .select('github_access_token, github_login')
      .eq('id', user.id)
      .maybeSingle()

    if (userErr) {
      console.error('[GitHub Repos] DB error fetching user row:', userErr.message)
    }

    const providerToken = userRow?.github_access_token ?? null
    const githubLogin =
      userRow?.github_login ||
      user.user_metadata?.user_name ||
      user.user_metadata?.login ||
      user.user_metadata?.preferred_username ||
      null

    let repos: any[] = []

    // 1. If providerToken exists, query authenticated GitHub API (includes private repos)
    if (providerToken) {
      try {
        const client = createGitHubClient(providerToken)
        const authenticatedRepos = await listUserRepositories(client, { perPage: 100 })
        repos = authenticatedRepos.map((r) => ({
          id: r.id,
          name: r.name,
          fullName: r.fullName,
          owner: r.owner,
          description: r.description || '',
          isPrivate: r.isPrivate,
          defaultBranch: r.defaultBranch,
          updatedAt: r.updatedAt,
          url: r.url,
        }))
      } catch (authErr: any) {
        console.warn('[GitHub Repos] Provider token query failed, falling back to public repos:', authErr.message)
      }
    }

    // 2. Fallback: If no provider token or token expired, fetch public repositories by githubLogin
    if (repos.length === 0 && githubLogin) {
      try {
        const headers: Record<string, string> = {
          'User-Agent': 'ShipPulse-App',
          Accept: 'application/vnd.github+json',
        }

        const ghRes = await fetch(
          `https://api.github.com/users/${encodeURIComponent(githubLogin)}/repos?per_page=100&sort=updated`,
          { headers, next: { revalidate: 30 } }
        )

        if (ghRes.ok) {
          const ghData = await ghRes.json()
          if (Array.isArray(ghData)) {
            repos = ghData.map((r: any) => ({
              id: r.id,
              name: r.name,
              fullName: r.full_name,
              owner: r.owner?.login || githubLogin,
              description: r.description || '',
              isPrivate: !!r.private,
              defaultBranch: r.default_branch || 'main',
              updatedAt: r.updated_at,
              url: r.html_url,
            }))
          }
        } else {
          console.warn('[GitHub Repos] Public repos fetch returned status:', ghRes.status)
        }
      } catch (publicErr: any) {
        console.error('[GitHub Repos] Failed to fetch public repos:', publicErr.message)
      }
    }

    // 3. If neither providerToken nor githubLogin returned repositories
    if (repos.length === 0 && !githubLogin && !providerToken) {
      return NextResponse.json({
        repositories: [],
        needsConnect: true,
        connectUrl: '/api/github/connect',
        message: 'Connect your GitHub account to import repositories.',
      })
    }

    // Apply search filter if provided
    if (query) {
      repos = repos.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.fullName.toLowerCase().includes(query) ||
          (r.description || '').toLowerCase().includes(query)
      )
    }

    return NextResponse.json({
      repositories: repos,
      needsConnect: false,
    })
  } catch (err: any) {
    console.error('[API /api/github/repos] Error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
