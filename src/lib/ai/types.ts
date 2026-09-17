// ============================================================
// ShipPulse — AI Types
// Normalized types across all providers
// ============================================================

export type OutputMode =
  | 'customer'
  | 'developer'
  | 'technical'
  | 'stakeholder'
  | 'internal'
  | 'social'
  | 'email'
  | 'short'
  | 'long'

export type AIJobType =
  | 'generate_release'
  | 'rewrite'
  | 'translate'
  | 'social'
  | 'email'
  | 'short'
  | 'expand'
  | 'simplify'

export type AIJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'retrying'
  | 'cancelled'

export interface ProjectAIConfig {
  projectId: string
  workspaceId: string
  tone: 'professional' | 'casual' | 'formal'
  length: 'short' | 'medium' | 'long'
  technicalDepth: OutputMode
  language: string
  useEmojis: boolean
  customInstructions?: string
}

export interface CommitSummary {
  sha: string
  message: string
  authorName?: string
  authorDate?: string
  additions: number
  deletions: number
  changedFiles: number
  isMerge: boolean
  url?: string
}

export interface PRSummary {
  number: number
  title: string
  body?: string
  state: 'open' | 'closed' | 'merged'
  labels: string[]
  mergedAt?: string
  authorLogin?: string
  url?: string
}

export interface TagSummary {
  name: string
  message?: string
  taggerDate?: string
  sha?: string
}

// ── Request / Response types ─────────────────────────────────

export interface AIGenerateRequest {
  type: AIJobType
  systemPrompt: string
  userMessage: string
  model: string
  temperature?: number
  maxTokens?: number
  projectId?: string
  workspaceId?: string
}

export interface AIProviderResult {
  provider: string
  model: string
  content: string
  tokensInput?: number
  tokensOutput?: number
  tokensTotal?: number
  latencyMs: number
  success: boolean
  error?: string
}

export interface AIGenerateResponse extends AIProviderResult {
  usedFallback: boolean
  fallbackReason?: string
  // Parsed JSON content if applicable
  parsed?: GeneratedRelease | GeneratedSocial | GeneratedEmail
}

export interface AIUsageRecord {
  workspaceId: string
  projectId?: string
  aiJobId?: string
  provider: string
  model: string
  type: AIJobType
  tokensInput: number
  tokensOutput: number
  tokensTotal: number
  latencyMs?: number
  success: boolean
  error?: string
  usedFallback: boolean
  fallbackReason?: string
}

// ── Parsed AI outputs ────────────────────────────────────────

export interface GeneratedReleaseEntry {
  title: string
  description: string
  category: 'New' | 'Improved' | 'Fixed' | 'Security' | 'Performance' | 'Breaking' | 'Removed' | 'Other'
}

export interface GeneratedRelease {
  title: string
  summary: string
  content: string  // markdown
  entries: GeneratedReleaseEntry[]
}

export interface GeneratedSocial {
  post: string
}

export interface GeneratedEmail {
  subject: string
  body: string  // markdown
}

// ── Provider interface ───────────────────────────────────────

export interface AIProvider {
  name: string
  generate(request: AIGenerateRequest): Promise<AIProviderResult>
  isAvailable(): Promise<boolean>
}
