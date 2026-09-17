// ============================================================
// ShipPulse  -  Slug Utilities
// Validation, generation, reserved word checks
// ============================================================

// Reserved slugs that cannot be used as project or workspace slugs
const RESERVED_SLUGS = new Set([
  'www', 'api', 'app', 'admin', 'dashboard', 'auth', 'login', 'logout',
  'signup', 'register', 'settings', 'profile', 'account', 'billing',
  'pricing', 'changelog', 'docs', 'documentation', 'help', 'support',
  'terms', 'privacy', 'legal', 'about', 'contact', 'blog', 'news',
  'status', 'health', 'ping', 'webhook', 'webhooks', 'widget', 'widget.js',
  'rss', 'atom', 'feed', 'sitemap', 'robots', 'favicon', 'assets',
  'static', 'public', 'cdn', 'media', 'uploads', 'files', 'images',
  'null', 'undefined', 'true', 'false', 'new', 'create', 'edit', 'delete',
  'team', 'teams', 'workspace', 'workspaces', 'project', 'projects',
  'release', 'releases', 'analytics', 'feedback', 'subscribers',
  'integrations', 'domains', 'members', 'invitations', 'notifications',
  'shippulse', 'ship-pulse', 'shipulse',
])

export const SLUG_RULES = {
  minLength: 2,
  maxLength: 50,
  pattern: /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
  noConsecutiveHyphens: /--/,
} as const

export interface SlugValidationResult {
  valid: boolean
  reason?: string
  normalized?: string
}

/**
 * Validate a slug for use as a project or workspace identifier.
 */
export function validateSlug(slug: string): SlugValidationResult {
  const normalized = slug.toLowerCase().trim()

  if (normalized.length < SLUG_RULES.minLength) {
    return { valid: false, reason: `Slug must be at least ${SLUG_RULES.minLength} characters.` }
  }

  if (normalized.length > SLUG_RULES.maxLength) {
    return { valid: false, reason: `Slug must be ${SLUG_RULES.maxLength} characters or fewer.` }
  }

  if (!SLUG_RULES.pattern.test(normalized)) {
    return {
      valid: false,
      reason: 'Slug may only contain lowercase letters, numbers, and hyphens. Must start and end with a letter or number.',
    }
  }

  if (SLUG_RULES.noConsecutiveHyphens.test(normalized)) {
    return { valid: false, reason: 'Slug may not contain consecutive hyphens.' }
  }

  if (RESERVED_SLUGS.has(normalized)) {
    return { valid: false, reason: `"${normalized}" is a reserved word and cannot be used as a slug.` }
  }

  return { valid: true, normalized }
}

/**
 * Generate a slug from a display name.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, SLUG_RULES.maxLength)
}

/**
 * Generate a unique slug by appending a numeric suffix if needed.
 */
export function generateUniqueSlug(
  base: string,
  existingSlugs: string[]
): string {
  const slug = generateSlug(base)
  const existing = new Set(existingSlugs)

  if (!existing.has(slug) && !RESERVED_SLUGS.has(slug)) return slug

  for (let i = 2; i <= 99; i++) {
    const candidate = `${slug}-${i}`
    if (!existing.has(candidate)) return candidate
  }

  // Fallback: append random suffix
  return `${slug}-${Math.random().toString(36).slice(2, 6)}`
}

/**
 * Validate a custom domain.
 */
export function validateDomain(domain: string): { valid: boolean; reason?: string } {
  const normalized = domain.toLowerCase().trim()

  // Remove protocol if accidentally included
  const withoutProtocol = normalized.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

  const domainPattern = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/

  if (!domainPattern.test(withoutProtocol)) {
    return { valid: false, reason: 'Please enter a valid domain (e.g. updates.yourcompany.com).' }
  }

  if (withoutProtocol.endsWith('.vercel.app') || withoutProtocol.endsWith('.ship-pulse.vercel.app')) {
    return { valid: false, reason: 'Cannot use Vercel preview domains as custom domains.' }
  }

  return { valid: true }
}
