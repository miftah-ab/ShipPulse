// ============================================================
// GET /api/health
// Internal health check  -  does NOT expose sensitive info
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  const checks: Record<string, { status: 'ok' | 'error'; message?: string }> = {}
  let overallStatus: 'ok' | 'degraded' | 'error' = 'ok'

  // ── Database ─────────────────────────────────────────────
  try {
    const supabase = createServiceClient()
    const { error } = await supabase
      .from('shippulse_categories')
      .select('id')
      .limit(1)

    checks.database = error
      ? { status: 'error', message: 'Database query failed' }
      : { status: 'ok' }
  } catch {
    checks.database = { status: 'error', message: 'Database connection failed' }
    overallStatus = 'error'
  }

  // ── AI Provider (Groq) ──────────────────────────────────
  checks.ai_groq = process.env.GROQ_API_KEY
    ? { status: 'ok' }
    : { status: 'error', message: 'GROQ_API_KEY not configured' }

  // ── AI Fallback (OpenRouter) ───────────────────────────
  checks.ai_openrouter = process.env.OPENROUTER_API_KEY
    ? { status: 'ok' }
    : { status: 'error', message: 'OPENROUTER_API_KEY not configured' }

  // ── GitHub OAuth ───────────────────────────────────────
  checks.github = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? { status: 'ok' }
    : { status: 'error', message: 'GitHub OAuth not configured' }

  // ── Email ─────────────────────────────────────────────
  checks.email = process.env.RESEND_API_KEY
    ? { status: 'ok' }
    : { status: 'error', message: 'RESEND_API_KEY not configured (email disabled)' }

  // Degrade status if any non-critical check fails
  if (Object.values(checks).some((c) => c.status === 'error')) {
    if (overallStatus === 'ok') overallStatus = 'degraded'
  }

  if (checks.database?.status === 'error') {
    overallStatus = 'error'
  }

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      checks,
    },
    { status: overallStatus === 'error' ? 503 : 200 }
  )
}
