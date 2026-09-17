// ============================================================
// ShipPulse  -  GitHub Service
// Real GitHub API integration via Octokit
// ============================================================

import { Octokit } from '@octokit/rest'
import { createHmac, timingSafeEqual } from 'crypto'
import type {
  GitHubRepo,
  GitHubCommit,
  GitHubPR,
  GitHubTag,
  GitHubRelease,
  GitHubWebhookEvent,
} from './types'

// ── Client factory ───────────────────────────────────────────
export function createGitHubClient(accessToken: string): Octokit {
  return new Octokit({
    auth: accessToken,
    userAgent: 'ShipPulse/1.0',
    throttle: {
      onRateLimit: (retryAfter: number, options: { method: string; url: string }, _octokit: Octokit, retryCount: number) => {
        console.warn(`[GitHub] Rate limited. Retry after ${retryAfter}s (attempt ${retryCount + 1})`)
        return retryCount < 2
      },
      onSecondaryRateLimit: (_retryAfter: number, options: { method: string; url: string }) => {
        console.warn(`[GitHub] Secondary rate limit on ${options.method} ${options.url}`)
        return false
      },
    },
  })
}

// ── Repository discovery ─────────────────────────────────────
export async function listUserRepositories(
  octokit: Octokit,
  options: { page?: number; perPage?: number } = {}
): Promise<GitHubRepo[]> {
  const { page = 1, perPage = 30 } = options

  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: perPage,
    page,
    affiliation: 'owner,collaborator,organization_member',
  })

  return data.map(mapRepo)
}

export async function listOrganizationRepositories(
  octokit: Octokit,
  org: string,
  options: { page?: number; perPage?: number } = {}
): Promise<GitHubRepo[]> {
  const { page = 1, perPage = 30 } = options

  const { data } = await octokit.repos.listForOrg({
    org,
    sort: 'updated',
    per_page: perPage,
    page,
  })

  return data.map(mapRepo)
}

export async function getRepository(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<GitHubRepo> {
  const { data } = await octokit.repos.get({ owner, repo })
  return mapRepo(data)
}

// ── Commits ──────────────────────────────────────────────────
export async function listCommits(
  octokit: Octokit,
  owner: string,
  repo: string,
  options: {
    branch?: string
    since?: string
    until?: string
    path?: string
    page?: number
    perPage?: number
  } = {}
): Promise<GitHubCommit[]> {
  const { branch, since, until, path, page = 1, perPage = 100 } = options

  const { data } = await octokit.repos.listCommits({
    owner,
    repo,
    sha: branch,
    since,
    until,
    path,
    per_page: perPage,
    page,
  })

  return data.map(mapCommit)
}

export async function getCommit(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string
): Promise<GitHubCommit> {
  const { data } = await octokit.repos.getCommit({ owner, repo, ref })
  return mapCommit(data)
}

// ── Pull Requests ────────────────────────────────────────────
export async function listMergedPullRequests(
  octokit: Octokit,
  owner: string,
  repo: string,
  options: { since?: string; page?: number; perPage?: number } = {}
): Promise<GitHubPR[]> {
  const { since, page = 1, perPage = 50 } = options

  const { data } = await octokit.pulls.list({
    owner,
    repo,
    state: 'closed',
    sort: 'updated',
    direction: 'desc',
    per_page: perPage,
    page,
  })

  // Filter to only merged PRs, optionally since a date
  const merged = data.filter((pr) => {
    if (!pr.merged_at) return false
    if (since && new Date(pr.merged_at) < new Date(since)) return false
    return true
  })

  return merged.map(mapPR)
}

// ── Tags ─────────────────────────────────────────────────────
export async function listTags(
  octokit: Octokit,
  owner: string,
  repo: string,
  options: { page?: number; perPage?: number } = {}
): Promise<GitHubTag[]> {
  const { page = 1, perPage = 50 } = options

  const { data } = await octokit.repos.listTags({
    owner,
    repo,
    per_page: perPage,
    page,
  })

  return data.map(mapTag)
}

// ── GitHub Releases ──────────────────────────────────────────
export async function listGitHubReleases(
  octokit: Octokit,
  owner: string,
  repo: string,
  options: { page?: number; perPage?: number } = {}
): Promise<GitHubRelease[]> {
  const { page = 1, perPage = 20 } = options

  const { data } = await octokit.repos.listReleases({
    owner,
    repo,
    per_page: perPage,
    page,
  })

  return data.map((r) => ({
    id: r.id,
    tagName: r.tag_name,
    name: r.name ?? r.tag_name,
    body: r.body ?? '',
    draft: r.draft,
    prerelease: r.prerelease,
    publishedAt: r.published_at ?? '',
    url: r.html_url,
  }))
}

// ── Webhooks ─────────────────────────────────────────────────
export async function createWebhook(
  octokit: Octokit,
  owner: string,
  repo: string,
  options: {
    callbackUrl: string
    secret: string
    events?: string[]
  }
): Promise<{ id: number; url: string }> {
  const { callbackUrl, secret, events = ['push', 'pull_request', 'release', 'create'] } = options

  const { data } = await octokit.repos.createWebhook({
    owner,
    repo,
    config: {
      url: callbackUrl,
      content_type: 'json',
      secret,
      insecure_ssl: '0',
    },
    events,
    active: true,
  })

  return { id: data.id, url: data.config?.url ?? callbackUrl }
}

export async function deleteWebhook(
  octokit: Octokit,
  owner: string,
  repo: string,
  hookId: number
): Promise<void> {
  await octokit.repos.deleteWebhook({ owner, repo, hook_id: hookId })
}

export async function listWebhooks(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<Array<{ id: number; url: string; active: boolean; events: string[] }>> {
  const { data } = await octokit.repos.listWebhooks({ owner, repo })
  return data.map((h) => ({
    id: h.id,
    url: h.config?.url ?? '',
    active: h.active,
    events: h.events,
  }))
}

// ── Webhook signature validation ─────────────────────────────
/**
 * Validate the X-Hub-Signature-256 header on incoming GitHub webhooks.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function validateWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) return false

  const expectedSig = `sha256=${createHmac('sha256', secret)
    .update(typeof payload === 'string' ? payload : payload)
    .digest('hex')}`

  try {
    return timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSig, 'utf8')
    )
  } catch {
    return false
  }
}

// ── Authenticated user ───────────────────────────────────────
export async function getAuthenticatedUser(octokit: Octokit) {
  const { data } = await octokit.users.getAuthenticated()
  return {
    id: data.id,
    login: data.login,
    name: data.name,
    email: data.email,
    avatarUrl: data.avatar_url,
  }
}

// ── Mappers ──────────────────────────────────────────────────
function mapRepo(data: any): GitHubRepo {
  return {
    id: data.id,
    fullName: data.full_name,
    name: data.name,
    owner: data.owner?.login ?? '',
    description: data.description ?? '',
    url: data.html_url,
    defaultBranch: data.default_branch ?? 'main',
    isPrivate: data.private,
    isFork: data.fork,
    language: data.language ?? null,
    starsCount: data.stargazers_count ?? 0,
    forksCount: data.forks_count ?? 0,
    updatedAt: data.updated_at,
  }
}

function mapCommit(data: any): GitHubCommit {
  return {
    sha: data.sha,
    message: data.commit?.message ?? '',
    authorName: data.commit?.author?.name ?? data.author?.login ?? '',
    authorEmail: data.commit?.author?.email ?? '',
    authorDate: data.commit?.author?.date ?? '',
    committerDate: data.commit?.committer?.date ?? '',
    url: data.html_url,
    additions: data.stats?.additions ?? 0,
    deletions: data.stats?.deletions ?? 0,
    changedFiles: data.stats?.total ?? 0,
    isMerge: (data.parents?.length ?? 0) > 1,
  }
}

function mapPR(data: any): GitHubPR {
  return {
    id: data.id,
    number: data.number,
    title: data.title,
    body: data.body ?? '',
    state: data.merged_at ? 'merged' : data.state,
    url: data.html_url,
    authorLogin: data.user?.login ?? '',
    baseBranch: data.base?.ref ?? '',
    headBranch: data.head?.ref ?? '',
    mergedAt: data.merged_at ?? null,
    closedAt: data.closed_at ?? null,
    labels: (data.labels ?? []).map((l: any) => l.name as string),
    additions: data.additions ?? 0,
    deletions: data.deletions ?? 0,
    changedFiles: data.changed_files ?? 0,
  }
}

function mapTag(data: any): GitHubTag {
  return {
    name: data.name,
    sha: data.commit?.sha ?? '',
    url: data.commit?.url ?? '',
  }
}
