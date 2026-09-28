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

    // Ingest commits into shippulse_commits table
    if (rawCommits.length > 0) {
      try {
        const commitRows = rawCommits.map((c) => ({
          repository_id: repoRecord.id,
          sha: c.sha,
          message: c.message,
          author_name: c.authorName,
          author_date: c.authorDate,
          url: c.url,
          is_merge: c.isMerge,
          branch,
        }))
        await serviceDb
          .from('shippulse_commits')
          .upsert(commitRows, { onConflict: 'repository_id,sha' })
      } catch (cErr: any) {
        console.warn('[Sync] Commit upsert warning:', cErr.message)
      }
    }

    // Auto-generate a release draft if commits exist and need publishing
    let createdRelease = null
    if (rawCommits.length > 0) {
      try {
        const { data: existingReleases } = await serviceDb
          .from('shippulse_releases')
          .select('id, version, created_at')
          .eq('project_id', project.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

        const releaseIndex = (existingReleases?.length || 0) + 1
        const detectedVersion = analysis.detectedVersion || `v1.0.${releaseIndex}`

        const features = rawCommits.filter(c => /feat(ure)?|add|new|implement|introduc/i.test(c.message))
        const fixes = rawCommits.filter(c => /fix|bug|error|crash|resolve|patch/i.test(c.message))
        const improvements = rawCommits.filter(c => !features.includes(c) && !fixes.includes(c) && !c.isMerge)

        const primaryHeadline = features[0]?.message.replace(/^feat(\([^)]+\))?:\s*/i, '') ||
                                improvements[0]?.message.replace(/^(chore|refactor)(\([^)]+\))?:\s*/i, '') ||
                                fixes[0]?.message.replace(/^fix(\([^)]+\))?:\s*/i, '') ||
                                'Core Updates & Improvements'

        const releaseTitle = `${detectedVersion} - ${primaryHeadline.charAt(0).toUpperCase() + primaryHeadline.slice(1)}`

        const contentSections: string[] = []
        if (features.length > 0) {
          contentSections.push(`### 🚀 New Features\n` + features.map(f => `- ${f.message}`).join('\n'))
        }
        if (improvements.length > 0) {
          contentSections.push(`### 🛠️ Improvements\n` + improvements.slice(0, 10).map(i => `- ${i.message}`).join('\n'))
        }
        if (fixes.length > 0) {
          contentSections.push(`### 🐛 Bug Fixes\n` + fixes.map(f => `- ${f.message}`).join('\n'))
        }
        if (contentSections.length === 0) {
          contentSections.push(rawCommits.slice(0, 10).map(c => `- ${c.message}`).join('\n'))
        }

        const releaseContent = contentSections.join('\n\n')
        const releaseSummary = `Synchronized ${rawCommits.length} commits from ${repoFullName} branch ${branch}. Key updates: ${primaryHeadline}.`
        const releaseSlug = `${detectedVersion.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`

        const { data: newRel, error: relErr } = await serviceDb
          .from('shippulse_releases')
          .insert({
            project_id: project.id,
            workspace_id: project.workspace_id,
            title: releaseTitle,
            slug: releaseSlug,
            version: detectedVersion,
            summary: releaseSummary,
            content: releaseContent,
            status: 'generated',
            is_ai_generated: true,
            created_by: user.id,
            tags: analysis.groups.map(g => g.theme).filter(Boolean).slice(0, 5),
          })
          .select()
          .single()

        if (!relErr && newRel) {
          createdRelease = newRel
          const entries = [
            ...features.map((f, i) => ({
              release_id: newRel.id,
              project_id: project.id,
              title: f.message.replace(/^feat(\([^)]+\))?:\s*/i, ''),
              description: `Commit ${f.sha} by ${f.authorName}`,
              is_ai_generated: true,
              sort_order: i,
            })),
            ...fixes.map((f, i) => ({
              release_id: newRel.id,
              project_id: project.id,
              title: f.message.replace(/^fix(\([^)]+\))?:\s*/i, ''),
              description: `Commit ${f.sha} by ${f.authorName}`,
              is_ai_generated: true,
              sort_order: features.length + i,
            })),
          ]

          if (entries.length > 0) {
            await serviceDb.from('shippulse_release_entries').insert(entries)
          }
        } else if (relErr) {
          console.warn('[Sync] Release creation warning:', relErr.message)
        }
      } catch (relGenErr: any) {
        console.warn('[Sync] Release generation error:', relGenErr.message)
      }
    }

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
      releaseCreated: createdRelease ? createdRelease.id : null,
      message: rawCommits.length > 0
        ? `Sync completed. Ingested ${rawCommits.length} new commits from ${repoFullName}${createdRelease ? ' and created a new release draft.' : '.'}`
        : 'Repository is already up to date. No new commits found.',
    })
  } catch (err: any) {
    console.error('[API /api/sync] Error:', err.message)
    return NextResponse.json({ error: err.message || 'Sync failed' }, { status: 500 })
  }
}
