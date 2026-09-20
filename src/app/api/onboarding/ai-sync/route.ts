import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { AIService } from '@/lib/ai/service'
import type { CommitSummary, PRSummary, TagSummary, ProjectAIConfig } from '@/lib/ai/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { repoUrl, repoBranch, projectName } = body

    if (!repoUrl) {
      return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 })
    }

    // 1. Fetch GitHub access token
    const serviceClient = createServiceClient()
    const { data: userRow } = await serviceClient
      .from('shippulse_users')
      .select('github_access_token')
      .eq('id', user.id)
      .single()

    let token = userRow?.github_access_token
    if (!token) {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      token = session?.provider_token
    }

    if (!token) {
      return NextResponse.json(
        {
          error: 'GitHub account is not connected. Please re-authenticate with GitHub.',
          needsConnect: true,
        },
        { status: 401 }
      )
    }

    // 2. Parse owner and repo
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) {
      return NextResponse.json({ error: 'Invalid GitHub repository URL' }, { status: 400 })
    }
    const owner = match[1]
    const repo = match[2].replace(/\.git$/, '')
    const branch = repoBranch || 'main'

    const ghHeaders = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'ShipPulse-App',
    }

    // 3. Fetch real commits from GitHub
    let commitsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(branch)}&per_page=35`,
      { headers: ghHeaders }
    )

    // Fallback to default branch if requested branch 404s
    if (!commitsRes.ok && commitsRes.status === 404) {
      commitsRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?per_page=35`,
        { headers: ghHeaders }
      )
    }

    if (!commitsRes.ok) {
      const ghErr = await commitsRes.json().catch(() => ({}))
      return NextResponse.json(
        {
          error: `GitHub API error: ${(ghErr as any).message || commitsRes.statusText}`,
        },
        { status: commitsRes.status === 401 ? 401 : 502 }
      )
    }

    const rawCommits = await commitsRes.json()
    const commitList = Array.isArray(rawCommits) ? rawCommits : []

    // 4. Fetch tags and PRs in parallel
    const [tagsRes, prsRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}/tags?per_page=5`, {
        headers: ghHeaders,
      }).catch(() => null),
      fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls?state=closed&per_page=10`,
        { headers: ghHeaders }
      ).catch(() => null),
    ])

    const rawTags = tagsRes && tagsRes.ok ? await tagsRes.json() : []
    const rawPrs = prsRes && prsRes.ok ? await prsRes.json() : []

    const tags: TagSummary[] = (Array.isArray(rawTags) ? rawTags : []).map((t: any) => ({
      name: t.name,
      sha: t.commit?.sha,
    }))

    const pullRequests: PRSummary[] = (Array.isArray(rawPrs) ? rawPrs : []).map((p: any) => ({
      number: p.number,
      title: p.title,
      body: p.body?.slice(0, 300) || '',
      state: p.state,
      labels: (p.labels || []).map((l: any) => l.name),
      mergedAt: p.merged_at,
      authorLogin: p.user?.login,
      url: p.html_url,
    }))

    const commits: CommitSummary[] = commitList.map((c: any) => ({
      sha: c.sha?.slice(0, 7) || '',
      message: c.commit?.message?.split('\n')[0] || 'Update',
      authorName: c.commit?.author?.name || c.author?.login || 'Developer',
      authorDate: c.commit?.author?.date || new Date().toISOString(),
      additions: 0,
      deletions: 0,
      changedFiles: 0,
      isMerge: (c.commit?.message || '').startsWith('Merge'),
      url: c.html_url || '',
    }))

    // 5. Determine version
    const latestTag = tags[0]?.name
    let suggestedVersion = 'v1.0.0'
    if (latestTag) {
      suggestedVersion = latestTag.startsWith('v') ? latestTag : `v${latestTag}`
    }

    // 6. Run AI generation with AIService
    const projectConfig: ProjectAIConfig = {
      projectId: 'onboarding-init',
      workspaceId: 'onboarding-init',
      tone: 'professional',
      length: 'medium',
      technicalDepth: 'customer',
      language: 'en',
      useEmojis: true,
      customInstructions: `Focus on highlighting key user-facing updates in ${projectName || repo}.`,
    }

    let releaseTitle = `${suggestedVersion} - Initial Release for ${projectName || repo}`
    let releaseSummary = `Synthesized ${commits.length} recent commits into customer-facing product enhancements.`
    let releaseContent = ''
    let entries: Array<{
      title: string
      description: string
      category: 'New' | 'Improved' | 'Fixed' | 'Security' | 'Performance' | 'Breaking' | 'Removed' | 'Other'
    }> = []

    if (commits.length > 0) {
      try {
        const aiRes = await AIService.generateRelease({
          projectConfig,
          commits,
          pullRequests,
          tags,
          outputMode: 'customer',
          language: 'en',
        })

        if (aiRes.parsed) {
          const parsed = aiRes.parsed as any
          if (parsed.title) releaseTitle = parsed.title
          if (parsed.summary) releaseSummary = parsed.summary
          if (parsed.content) releaseContent = parsed.content
          if (Array.isArray(parsed.entries) && parsed.entries.length > 0) {
            entries = parsed.entries
          }
        }
      } catch (err: any) {
        console.warn('[Onboarding AI Sync] AI Service error, applying smart heuristic clustering:', err.message)
      }
    }

    // 7. Heuristic fallback if entries are empty (guarantees real content from commits)
    if (entries.length === 0 && commits.length > 0) {
      const nonMergeCommits = commits.filter((c) => !c.isMerge)
      const targetCommits = nonMergeCommits.length > 0 ? nonMergeCommits : commits

      entries = targetCommits.slice(0, 5).map((c) => {
        const msg = c.message
        let category: 'New' | 'Improved' | 'Fixed' | 'Performance' | 'Other' = 'Other'
        let cleanTitle = msg

        if (/^feat(\(.*\))?:/i.test(msg)) {
          category = 'New'
          cleanTitle = msg.replace(/^feat(\(.*\))?:\s*/i, '')
        } else if (/^fix(\(.*\))?:/i.test(msg)) {
          category = 'Fixed'
          cleanTitle = msg.replace(/^fix(\(.*\))?:\s*/i, '')
        } else if (/^(perf|optimiz)(\(.*\))?:/i.test(msg)) {
          category = 'Performance'
          cleanTitle = msg.replace(/^perf(\(.*\))?:\s*/i, '')
        } else if (/^(refactor|chore|style)(\(.*\))?:/i.test(msg)) {
          category = 'Improved'
          cleanTitle = msg.replace(/^(refactor|chore|style)(\(.*\))?:\s*/i, '')
        }

        return {
          title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
          description: `Commit ${c.sha} by ${c.authorName}: ${msg}`,
          category,
        }
      })
    }

    return NextResponse.json({
      success: true,
      repoFullName: `${owner}/${repo}`,
      branch,
      commitCount: commits.length,
      recentCommits: commits.slice(0, 8),
      release: {
        version: suggestedVersion,
        title: releaseTitle,
        summary: releaseSummary,
        content: releaseContent,
        entries,
      },
    })
  } catch (err: any) {
    console.error('[API /api/onboarding/ai-sync] Unexpected error:', err.message)
    return NextResponse.json({ error: err.message || 'Failed to sync repository' }, { status: 500 })
  }
}
