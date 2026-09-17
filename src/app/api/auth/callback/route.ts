// ============================================================
// POST /api/auth/github/callback
// Exchange GitHub OAuth code for token, store in workspace
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('GitHub authorization was denied or failed.')}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('No authorization code received from GitHub.')}`
    )
  }

  const supabase = await createClient()

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[Auth] Code exchange failed:', exchangeError.message)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
    )
  }

  // Redirect to onboarding if first time, otherwise dashboard
  const redirectTo = next.startsWith('/') ? next : '/dashboard'
  return NextResponse.redirect(`${origin}${redirectTo}`)
}
