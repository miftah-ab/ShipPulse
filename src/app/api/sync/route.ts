// ============================================================
// POST /api/sync
// Trigger repository synchronization & AI change analysis
// Fetches real commits from GitHub using the project's repo_url
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { analyzeChanges } from '@/lib/sync/engine'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const projectSlug = body.projectSlug

    if (!projectSlug) {
      return NextResponse.json({ error: 'projectSlug is required' }, { status: 400 })
    }

    const serviceDb = createServiceClient()

    // Find project
    const { data: project, error: pErr } = await serviceDb
      .from('shippulse_projects')
      .select('id, workspace_id, name, slug, repo_url, default_branch, last_synced_at')
      .eq('slug', projectSlug)
      .is('deleted_at', null)
      .maybeSingle()

    if (pErr || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify user workspace membership
    const { data: membership } = await serviceDb
      .from('shippulse_memberships')
      .select('role')
      .eq('workspace_id', project.workspace_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!project.repo_url) {
      return NextResponse.json({
        error: 'No repository connected. Configure a GitHub repository in the Integrations page first.',
      }, { status: 422 })
    }

    // Get provider token from session
    const { data: { session } } = await supabase.auth.getSession()
    const providerToken = session?.provider_token

    if (!providerToken) {
      return NextResponse.json({
        error: 'GitHub OAuth token missing. Please reconnect your GitHub account.',
      }, { status: 401 })
    }

    // Parse owner/repo from repo_url
    const repoMatch = project.repo_url.match(/github\.com\/([^/]+\/[^/]+)/)
    if (!repoMatch) {
      return NextResponse.json({ error: 'Invalid repository URL format.' }, { status: 422 })
    }
    const repoFullName = repoMatch[1].replace(/\.git$/, '')
    const branch = project.default_branch || 'main'

    // Build `since` param from last sync timestamp
    const since = project.last_synced_at
      ? `&since=${encodeURIComponent(project.last_synced_at)}`
      : ''

    const ghRes = await fetch(
      `https://api.github.com/repos/${repoFullName}/commits?sha=${branch}&per_page=50${since}`,
      {
        headers: {
          Authorization: `token ${providerToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    if (!ghRes.ok) {
      const ghErr = await ghRes.json().catch(() => ({}))
      return NextResponse.json({
        error: `GitHub API error: ${(ghErr as any).message || ghRes.statusText}`,
      }, { status: 502 })
    }

    const commits = await ghRes.json()

    const rawCommits = (commits as any[]).map((c) => ({
      sha: c.sha?.slice(0, 7) || '',
      message: c.commit?.message?.split('\n')[0] || '',
      authorName: c.commit?.author?.name || 'Unknown',
      authorDate: c.commit?.author?.date || new Date().toISOString(),
      additions: 0,
      deletions: 0,
      changedFiles: 0,
      url: c.html_url || '',
      isMerge: (c.commit?.message || '').startsWith('Merge'),
    }))

    const analysis = analyzeChanges(rawCommits, [], [])

    // Update last_synced_at timestamp
    await serviceDb
      .from('shippulse_projects')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', project.id)

    return NextResponse.json({
      success: true,
      analysis,
      commitsIngested: rawCommits.length,
      message: rawCommits.length > 0
        ? `Sync completed. Ingested ${rawCommits.length} new commits from ${repoFullName}.`
        : 'Repository is already up to date. No new commits found.',
    })
  } catch (err: any) {
    console.error('[API /api/sync] Error:', err.message)
    return NextResponse.json({ error: err.message || 'Sync failed' }, { status: 500 })
  }
}
