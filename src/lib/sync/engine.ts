// ============================================================
// ShipPulse — Sync Engine
// Intelligent change detection and grouping
// ============================================================

import type { CommitSummary, PRSummary, TagSummary } from '@/lib/ai/types'
import { sanitizeCommitMessage, sanitizePRBody } from '@/lib/ai/security'

export interface ChangeGroup {
  id: string
  theme: string          // detected theme, e.g. "authentication", "payments"
  commits: CommitSummary[]
  pullRequests: PRSummary[]
  tags: TagSummary[]
  suggestedCategory: string
  significance: 'high' | 'medium' | 'low'
  isNoise: boolean       // true if likely not worth a user-facing entry
}

export interface SyncAnalysis {
  groups: ChangeGroup[]
  noisyCommits: CommitSummary[]
  totalCommits: number
  totalPRs: number
  totalTags: number
  detectedVersion?: string
}

// Patterns that indicate a commit is noise
const NOISE_PATTERNS = [
  /^merge (branch|pull request|remote)/i,
  /^chore(\(.+\))?:\s*(bump|update|deps|dependencies|lock)/i,
  /^(fixup|squash)!/i,
  /^wip(\b|:)/i,
  /^(revert|undo)\s+"?merge/i,
  /^\d+\.\d+\.\d+$/, // bare version bump commits
  /^update\s+(package(-lock)?\.json|yarn\.lock|pnpm-lock)/i,
  /^(lint|format|prettier|eslint)/i,
  /^(release|publish)\s+v?\d+\.\d+/i,
]

// Patterns to detect semantic meaning
const SEMANTIC_PATTERNS: Array<{ pattern: RegExp; category: string; theme: string }> = [
  { pattern: /auth(entication|orization)?|login|logout|oauth|jwt|session|token/i, category: 'Improved', theme: 'authentication' },
  { pattern: /payment|billing|invoice|stripe|subscription|charge/i, category: 'Improved', theme: 'payments' },
  { pattern: /performance|speed|fast|slow|optimiz|cache|latency/i, category: 'Performance', theme: 'performance' },
  { pattern: /security|vuln|cve|sanitiz|xss|csrf|injection/i, category: 'Security', theme: 'security' },
  { pattern: /break(ing)?(\s+change)?|deprecat/i, category: 'Breaking', theme: 'breaking' },
  { pattern: /fix|bug|error|crash|issue|resolve|patch/i, category: 'Fixed', theme: 'bug-fixes' },
  { pattern: /feat(ure)?|add|new|implement|introduc/i, category: 'New', theme: 'feature' },
  { pattern: /ui|ux|design|style|layout|visual|component|interface/i, category: 'Improved', theme: 'ui' },
  { pattern: /api|endpoint|route|webhook/i, category: 'Improved', theme: 'api' },
  { pattern: /database|db|migration|schema|query/i, category: 'Improved', theme: 'database' },
  { pattern: /test|spec|coverage|jest|cypress/i, category: 'Other', theme: 'testing' },
  { pattern: /docs?|documentation|readme|changelog/i, category: 'Other', theme: 'docs' },
  { pattern: /remove|delete|drop|deprecat/i, category: 'Removed', theme: 'removal' },
]

/**
 * Main sync analysis function.
 * Groups related commits/PRs, filters noise, detects semantic themes.
 */
export function analyzeChanges(
  commits: CommitSummary[],
  pullRequests: PRSummary[],
  tags: TagSummary[]
): SyncAnalysis {
  // Sanitize all content
  const safeCommits = commits.map(sanitizeCommit)
  const safePRs = pullRequests.map(sanitizePR)

  // Separate noise from signal
  const { signal: signalCommits, noise: noisyCommits } = partitionNoise(safeCommits)

  // Group by detected theme
  const groups = groupByTheme(signalCommits, safePRs, tags)

  // Detect version from tags
  const detectedVersion = detectVersion(tags)

  return {
    groups,
    noisyCommits,
    totalCommits: commits.length,
    totalPRs: pullRequests.length,
    totalTags: tags.length,
    detectedVersion,
  }
}

// ── Noise filtering ──────────────────────────────────────────
function partitionNoise(commits: CommitSummary[]): {
  signal: CommitSummary[]
  noise: CommitSummary[]
} {
  const signal: CommitSummary[] = []
  const noise: CommitSummary[] = []

  for (const commit of commits) {
    if (isNoise(commit)) {
      noise.push(commit)
    } else {
      signal.push(commit)
    }
  }

  return { signal, noise }
}

function isNoise(commit: CommitSummary): boolean {
  const msg = commit.message.toLowerCase().trim()

  // Merge commits with no meaningful message
  if (commit.isMerge && /^merge (branch|pull request)/i.test(msg)) return true

  for (const pattern of NOISE_PATTERNS) {
    if (pattern.test(msg)) return true
  }

  // Very short messages with no substance
  if (msg.length < 5) return true

  return false
}

// ── Semantic grouping ────────────────────────────────────────
function groupByTheme(
  commits: CommitSummary[],
  pullRequests: PRSummary[],
  tags: TagSummary[]
): ChangeGroup[] {
  const themeMap = new Map<string, {
    commits: CommitSummary[]
    pullRequests: PRSummary[]
    category: string
    significance: 'high' | 'medium' | 'low'
  }>()

  // Assign commits to themes
  for (const commit of commits) {
    const theme = detectTheme(commit.message)
    if (!themeMap.has(theme.theme)) {
      themeMap.set(theme.theme, { commits: [], pullRequests: [], category: theme.category, significance: 'low' })
    }
    const group = themeMap.get(theme.theme)!
    group.commits.push(commit)
  }

  // Assign PRs to themes (PRs often carry more signal)
  for (const pr of pullRequests) {
    const combined = `${pr.title} ${pr.body ?? ''}`
    const theme = detectTheme(combined)
    if (!themeMap.has(theme.theme)) {
      themeMap.set(theme.theme, { commits: [], pullRequests: [], category: theme.category, significance: 'medium' })
    }
    const group = themeMap.get(theme.theme)!
    group.pullRequests.push(pr)
    // PRs increase significance
    group.significance = 'medium'
  }

  // Build ChangeGroup array
  const groups: ChangeGroup[] = []
  let i = 0
  for (const [theme, data] of themeMap) {
    const sig = computeSignificance(data.commits, data.pullRequests, theme)
    groups.push({
      id: `group-${i++}`,
      theme,
      commits: data.commits,
      pullRequests: data.pullRequests,
      tags: theme === 'release' ? tags : [],
      suggestedCategory: data.category,
      significance: sig,
      isNoise: sig === 'low' && data.commits.length === 0 && data.pullRequests.length === 0,
    })
  }

  // Sort by significance
  return groups.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.significance] - order[b.significance]
  })
}

function detectTheme(text: string): { theme: string; category: string } {
  for (const { pattern, category, theme } of SEMANTIC_PATTERNS) {
    if (pattern.test(text)) return { theme, category }
  }
  return { theme: 'general', category: 'Other' }
}

function computeSignificance(
  commits: CommitSummary[],
  prs: PRSummary[],
  theme: string
): 'high' | 'medium' | 'low' {
  if (theme === 'security' || theme === 'breaking') return 'high'
  if (prs.length > 0) return 'medium'
  if (commits.length >= 3) return 'medium'
  if (commits.length > 0) return 'low'
  return 'low'
}

// ── Version detection ────────────────────────────────────────
function detectVersion(tags: TagSummary[]): string | undefined {
  if (tags.length === 0) return undefined

  // Sort tags by semantic version
  const sorted = [...tags].sort((a, b) => {
    const va = parseVersion(a.name)
    const vb = parseVersion(b.name)
    if (!va || !vb) return 0
    return vb[0] - va[0] || vb[1] - va[1] || vb[2] - va[2]
  })

  return sorted[0]?.name
}

function parseVersion(tag: string): [number, number, number] | null {
  const match = tag.replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!match) return null
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
}

// ── Sanitizers ───────────────────────────────────────────────
function sanitizeCommit(c: CommitSummary): CommitSummary {
  return {
    ...c,
    message: sanitizeCommitMessage(c.message),
  }
}

function sanitizePR(pr: PRSummary): PRSummary {
  return {
    ...pr,
    title: sanitizeCommitMessage(pr.title),
    body: sanitizePRBody(pr.body),
  }
}

/**
 * Filter groups down to only those worth generating a release entry for.
 */
export function filterSignificantGroups(groups: ChangeGroup[]): ChangeGroup[] {
  return groups.filter(
    (g) => !g.isNoise && (g.commits.length > 0 || g.pullRequests.length > 0)
  )
}
