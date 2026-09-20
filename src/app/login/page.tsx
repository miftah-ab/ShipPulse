'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { sanitizeErrorMessage } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGitHubLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          scopes: 'read:user user:email repo',
        },
      })
      if (error) throw error
    } catch (err: any) {
      setError(sanitizeErrorMessage(err, 'Failed to initialize GitHub authentication. Please try again.'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0D14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              ShipPulse
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4">Welcome back</h1>
          <p className="text-xs text-slate-400 mt-1">Sign in to manage your release notes and product updates</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-white">Sign In</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Connect your GitHub account for instant repository sync
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && (
              <div className="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                {error}
              </div>
            )}

            {/* GitHub Sign-In Button */}
            <Button
              id="btn-github-login"
              onClick={handleGitHubLogin}
              disabled={loading}
              className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-3 transition-all duration-200 text-sm font-medium"
            >
              <svg className="h-5 w-5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>{loading ? 'Redirecting to GitHub…' : 'Continue with GitHub'}</span>
            </Button>

            {/* Divider + trust note */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-800" />
              <p className="text-[11px] text-slate-500 whitespace-nowrap">OAuth only — we never store your password</p>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            {/* Permissions list */}
            <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3 space-y-1.5">
              <p className="text-[11px] font-medium text-slate-400">ShipPulse requests access to:</p>
              <ul className="space-y-1">
                {[
                  'Read your public profile & email',
                  'List repositories (public & private)',
                  'Read commits, tags, and pull requests',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[11px] text-slate-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-slate-400">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-slate-400">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
