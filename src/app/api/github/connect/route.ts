// ============================================================
// GET /api/github/connect
// Re-triggers GitHub OAuth to obtain / refresh the provider_token.
// Redirects the user through Supabase GitHub sign-in with the
// `repo` scope so ShipPulse can read their repositories.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url)
  const next = searchParams.get('next') ?? '/onboarding'

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      // Request `repo` scope so we can list private + public repositories
      scopes: 'read:user user:email repo',
      redirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      // Force re-consent so we always get a fresh provider_token
      queryParams: { prompt: 'consent' },
    },
  })

  if (error || !data.url) {
    console.error('[GitHub Connect] OAuth init failed:', error?.message)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Failed to initiate GitHub connection.')}`
    )
  }

  return NextResponse.redirect(data.url)
}
