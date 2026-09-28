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
      .select('id, workspace_id, name, slug')
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

    // Find active repository connection
    const { data: connection } = await serviceDb
      .from('shippulse_repository_connections')
      .select('id, repository_id, branch, is_active')
      .eq('project_id', project.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!connection || !connection.repository_id) {
      return NextResponse.json({
        error: 'No repository connected. Configure a GitHub repository in the Integrations page first.',
      }, { status: 422 })
    }

    const { data: repoRecord } = await serviceDb
      .from('shippulse_repositories')
      .select('id, full_name, url, default_branch, last_synced_at')
      .eq('id', connection.repository_id)
      .maybeSingle()

    if (!repoRecord || !repoRecord.url) {
      return NextResponse.json({
        error: 'Connected repository not found. Please re-connect your repository.',
      }, { status: 422 })
    }

    // Get provider token from session or github tokens table
    let providerToken: string | null | undefined
    const { data: { session } } = await supabase.auth.getSession()
    providerToken = session?.provider_token

    if (!providerToken) {
      const { data: tokenRecord } = await serviceDb
        .from('shippulse_github_tokens')
        .select('access_token')
        .eq('workspace_id', project.workspace_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (tokenRecord?.access_token) {
        providerToken = tokenRecord.access_token
      }
    }

    // Parse owner/repo from repo URL or full_name
    const repoMatch = repoRecord.url.match(/github\.com\/([^/]+\/[^/]+)/)
    const repoFullName = repoRecord.full_name || (repoMatch ? repoMatch[1].replace(/\.git$/, '') : '')
    if (!repoFullName) {
      return NextResponse.json({ error: 'Invalid repository format.' }, { status: 422 })
    }
    const branch = connection.branch || repoRecord.default_branch || 'main'

    // Build `since` param from last sync timestamp
    const since = repoRecord.last_synced_at
      ? `&since=${encodeURIComponent(repoRecord.last_synced_at)}`
      : ''

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'ShipPulse/1.0',
    }
    if (providerToken) {
      headers['Authorization'] = `token ${providerToken}`
    }

    const ghRes = await fetch(
      `https://api.github.com/repos/${repoFullName}/commits?sha=${branch}&per_page=50${since}`,
      { headers }
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

    // Update last_synced_at timestamp on repository
    await serviceDb
      .from('shippulse_repositories')
      .update({
        last_synced_at: new Date().toISOString(),
        sync_status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', repoRecord.id)

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
