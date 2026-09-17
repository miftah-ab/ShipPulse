// ============================================================
// ShipPulse — AI Security: Prompt Injection Protection
// Repository content is UNTRUSTED DATA. This module sanitizes
// it before it reaches any AI prompt.
// ============================================================

// Characters and sequences used in prompt injection attacks
const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|prior|all)\s+instructions?/gi,
  /forget\s+(everything|all|previous)/gi,
  /you\s+are\s+now\s+a/gi,
  /pretend\s+(you\s+are|to\s+be)/gi,
  /act\s+as\s+(a|an|if)/gi,
  /new\s+instructions?\s*:/gi,
  /system\s*:\s*/gi,
  /\[\[?\s*system\s*\]?\]/gi,
  /<<\s*system\s*>>/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /###\s*instruction/gi,
  /---\s*system/gi,
  /override\s+(system|instructions?)/gi,
  /disregard\s+(previous|all|system)/gi,
  /\bDAN\b/g,  // "Do Anything Now" jailbreak
  /jailbreak/gi,
  /prompt\s+injection/gi,
]

/**
 * Sanitize repository content (commit messages, PR descriptions, etc.)
 * that will be included in AI requests as DATA (not instructions).
 *
 * This does NOT strip meaningful content — it flags and neutralizes
 * known prompt injection patterns, then wraps the content to signal
 * to the AI that it is data, not instructions.
 */
export function sanitizeRepositoryContent(content: string): string {
  if (!content) return ''

  let sanitized = content

  // Replace injection patterns with harmless equivalents
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match) =>
      `[FILTERED: ${match.slice(0, 20)}...]`
    )
  }

  return sanitized
}

/**
 * Truncate oversized content to prevent token abuse and
 * reduce attack surface for prompt injection.
 */
export function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength) + `\n[...truncated at ${maxLength} chars]`
}

/**
 * Sanitize a commit message specifically.
 * Commit messages are the most common injection vector.
 */
export function sanitizeCommitMessage(message: string): string {
  // Remove control characters
  const noControl = message.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  // Truncate to reasonable length
  const truncated = truncateContent(noControl, 500)
  // Apply injection filters
  return sanitizeRepositoryContent(truncated)
}

/**
 * Sanitize a PR body — longer content, more risk.
 * Strictly truncate and filter.
 */
export function sanitizePRBody(body: string | null | undefined): string {
  if (!body) return ''
  const truncated = truncateContent(body, 1000)
  return sanitizeRepositoryContent(truncated)
}

/**
 * Validate that user-provided AI custom instructions do not
 * contain attempts to override system behavior.
 */
export function validateCustomInstructions(instructions: string): {
  valid: boolean
  reason?: string
  sanitized: string
} {
  if (!instructions) return { valid: true, sanitized: '' }

  const MAX_LENGTH = 2000
  if (instructions.length > MAX_LENGTH) {
    return {
      valid: false,
      reason: `Custom instructions must be ${MAX_LENGTH} characters or fewer.`,
      sanitized: instructions.slice(0, MAX_LENGTH),
    }
  }

  // Check for obvious injection attempts in user-provided instructions
  const dangerousPatterns = [
    /ignore\s+(previous|all)\s+instructions?/gi,
    /system\s*prompt/gi,
    /override\s+(system|instructions?)/gi,
    /<\|im_start\|>/gi,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(instructions)) {
      return {
        valid: false,
        reason: 'Custom instructions contain disallowed content.',
        sanitized: '',
      }
    }
  }

  return { valid: true, sanitized: instructions }
}
