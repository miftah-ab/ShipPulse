// ============================================================
// ShipPulse  -  GitHub Types
// ============================================================

export interface GitHubRepo {
  id: number
  fullName: string
  name: string
  owner: string
  description: string
  url: string
  defaultBranch: string
  isPrivate: boolean
  isFork: boolean
  language: string | null
  starsCount: number
  forksCount: number
  updatedAt: string
}

export interface GitHubCommit {
  sha: string
  message: string
  authorName: string
  authorEmail: string
  authorDate: string
  committerDate: string
  url: string
  additions: number
  deletions: number
  changedFiles: number
  isMerge: boolean
}

export interface GitHubPR {
  id: number
  number: number
  title: string
  body: string
  state: 'open' | 'closed' | 'merged'
  url: string
  authorLogin: string
  baseBranch: string
  headBranch: string
  mergedAt: string | null
  closedAt: string | null
  labels: string[]
  additions: number
  deletions: number
  changedFiles: number
}

export interface GitHubTag {
  name: string
  sha: string
  url: string
  message?: string
  taggerName?: string
  taggerDate?: string
}

export interface GitHubRelease {
  id: number
  tagName: string
  name: string
  body: string
  draft: boolean
  prerelease: boolean
  publishedAt: string
  url: string
}

export interface GitHubWebhookEvent {
  deliveryId: string
  eventType: 'push' | 'pull_request' | 'release' | 'create' | string
  payload: Record<string, unknown>
  signature: string
}
