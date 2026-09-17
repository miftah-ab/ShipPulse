// ============================================================
// ShipPulse  -  Rate Limiter
// Server-side rate limiting for all sensitive endpoints
// ============================================================

import { createClient } from '@supabase/supabase-js'

interface RateLimitConfig {
  identifier: string   // IP address or user_id
  endpoint: string     // route identifier
  limitPerMinute: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  retryAfter?: number  // seconds
}

/**
 * Check rate limit using the database.
 * Uses a sliding 60-second window.
 * For production, consider using an in-memory store (Redis/Upstash)
 * as a performance optimization  -  the DB approach is correct for $0 budget.
 */
export async function checkRateLimit(
  supabase: any,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { identifier, endpoint, limitPerMinute } = config
  const windowStart = new Date(Date.now() - 60_000)
  const resetAt = new Date(Date.now() + 60_000)

  // Count requests in the last 60 seconds
  const { count, error } = await supabase
    .from('shippulse_rate_limit_log')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .eq('endpoint', endpoint)
    .gte('created_at', windowStart.toISOString())

  if (error) {
    // Fail open if DB error  -  log and allow
    console.error('[RateLimit] DB error:', error.message)
    return { allowed: true, remaining: limitPerMinute, resetAt }
  }

  const currentCount = count ?? 0

  if (currentCount >= limitPerMinute) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter: 60,
    }
  }

  // Record this request
  await (supabase as any)
    .from('shippulse_rate_limit_log')
    .insert({
      identifier,
      endpoint,
      count: 1,
      window_start: windowStart.toISOString(),
    })

  return {
    allowed: true,
    remaining: limitPerMinute - currentCount - 1,
    resetAt,
  }
}

/**
 * Rate limit headers for API responses
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt.getTime() / 1000)),
    ...(result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {}),
  }
}

/**
 * Extract a safe identifier from a request.
 * Prefers authenticated user ID over IP address.
 */
export function getIdentifier(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`

  // Try to get IP from Vercel/proxy headers
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return `ip:${ip}`
}

// Predefined limits per endpoint category
export const RATE_LIMITS = {
  public: parseInt(process.env.RATE_LIMIT_PUBLIC_RPM ?? '60'),
  auth: parseInt(process.env.RATE_LIMIT_AUTH_RPM ?? '20'),
  ai: parseInt(process.env.RATE_LIMIT_AI_RPM ?? '10'),
  webhook: parseInt(process.env.RATE_LIMIT_WEBHOOK_RPM ?? '30'),
  api: 60,
  feedback: 10,
  subscribe: 5,
} as const
