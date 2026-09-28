// ============================================================
// ShipPulse  -  Universal Sync & Auto-Release Service
// Automatically detects commits from GitHub and generates
// real changelog release drafts or published notes.
// ============================================================

import { createServiceClient } from '@/lib/supabase/server'
import { analyzeChanges } from './engine'

export interface SyncOptions {
  projectId: string
  userId?: string
  workspaceId?: string
  force?: boolean
  autoPublish?: boolean
}

export interface SyncResult {
  success: boolean
  commitsIngested: number
  releaseCreated?: any
  message: string
  error?: string
}

export async function runProjectSync(options: SyncOptions): Promise<SyncResult> {
  const { projectId, userId, force } = options
  const serviceDb = createServiceClient()

  try {
    // 1. Fetch project details
    const { data: project, error: pErr } = await serviceDb
      .from('shippulse_projects')
      .select('id, workspace_id, name, slug, auto_publish_enabled')
      .eq('id', projectId)
      .is('deleted_at', null)
      .maybeSingle()

    if (pErr || !project) {
      return { success: false, commitsIngested: 0, message: 'Project not found' }
    }

    // 2. Find active connected repository
    const { data: connection } = await serviceDb
      .from('shippulse_repository_connections')
      .select('id, repository_id, branch, is_active')
      .eq('project_id', project.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!connection?.repository_id) {
      return {
        success: false,
        commitsIngested: 0,
        message: 'No repository connected. Please connect a GitHub repository in Integrations.',
      }
    }

    const { data: repoRecord } = await serviceDb
      .from('shippulse_repositories')
      .select('id, full_name, url, default_branch, last_synced_at')
      .eq('id', connection.repository_id)
      .maybeSingle()

    if (!repoRecord?.url) {
      return { success: false, commitsIngested: 0, message: 'Connected repository metadata not found' }
    }

    // 3. Resolve GitHub OAuth token
    let providerToken: string | null | undefined = null
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

    // 4. Parse repo details
    const repoMatch = repoRecord.url.match(/github\.com\/([^/]+\/[^/]+)/)
    const repoFullName = repoRecord.full_name || (repoMatch ? repoMatch[1].replace(/\.git$/, '') : '')
    if (!repoFullName) {
      return { success: false, commitsIngested: 0, message: 'Invalid repository format' }
    }

    const branch = connection.branch || repoRecord.default_branch || 'main'

    // If not forcing, use last_synced_at to only fetch new commits
    const since = (!force && repoRecord.last_synced_at)
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
      const errMsg = (ghErr as any).message || ghRes.statusText
      console.warn(`[Auto-Sync] GitHub fetch error for ${repoFullName}:`, errMsg)
      return { success: false, commitsIngested: 0, message: `GitHub API error: ${errMsg}` }
    }

    const commits = await ghRes.json()
    if (!Array.isArray(commits)) {
      return { success: true, commitsIngested: 0, message: 'No new commits' }
    }

    const rawCommits = commits.map((c: any) => ({
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

    // Ingest commits into shippulse_commits
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
        console.warn('[Auto-Sync] Commit upsert warning:', cErr.message)
      }
    }

    const analysis = analyzeChanges(rawCommits, [], [])

    // Check existing releases
    const { data: existingReleases } = await serviceDb
      .from('shippulse_releases')
      .select('id, version, created_at')
      .eq('project_id', project.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    let createdRelease = null

    // Generate release if:
    // 1) New commits were found
    // 2) OR the project has 0 releases and we have any commits
    if (rawCommits.length > 0 || (existingReleases?.length === 0 && rawCommits.length > 0)) {
      try {
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

        // Check if should auto-publish
        const shouldPublish = options.autoPublish || project.auto_publish_enabled
        const releaseStatus = shouldPublish ? 'published' : 'generated'
        const publishedAt = shouldPublish ? new Date().toISOString() : null

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
            status: releaseStatus,
            published_at: publishedAt,
            is_ai_generated: true,
            created_by: userId || null,
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
          console.warn('[Auto-Sync] Release creation warning:', relErr.message)
        }
      } catch (relGenErr: any) {
        console.warn('[Auto-Sync] Release generation error:', relGenErr.message)
      }
    }

    // Update last_synced_at on repository
    await serviceDb
      .from('shippulse_repositories')
      .update({
        last_synced_at: new Date().toISOString(),
        sync_status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', repoRecord.id)

    return {
      success: true,
      commitsIngested: rawCommits.length,
      releaseCreated: createdRelease,
      message: rawCommits.length > 0
        ? `Sync completed. Ingested ${rawCommits.length} commits from ${repoFullName}${createdRelease ? ' and created a new release.' : '.'}`
        : 'Repository is already up to date. No new commits found.',
    }
  } catch (err: any) {
    console.error('[Auto-Sync] Execution error:', err.message)
    return { success: false, commitsIngested: 0, message: err.message || 'Sync failed' }
  }
}
