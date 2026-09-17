import React from 'react'
import Link from 'next/link'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      <header className="border-b border-slate-800/80 bg-[#0A0D14]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-base text-white">ShipPulse</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Privacy Policy</h1>
          <p className="text-xs text-slate-500 mt-1">Last updated: September 13, 2026</p>
        </div>

        <section className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <h2 className="text-base font-bold text-white">1. Information We Collect</h2>
          <p>
            When you connect your GitHub account or repositories to ShipPulse, we only request the permissions necessary to read commit messages, pull request titles, and metadata tags. We do not clone, store, or sell your source code files.
          </p>
          <p>
            For email subscribers and widget analytics, we collect anonymous impression events and email addresses solely for dispatching requested changelog notifications.
          </p>
        </section>

        <section className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <h2 className="text-base font-bold text-white">2. AI Processing and Security</h2>
          <p>
            Data sent to our AI providers (Groq and OpenRouter) consists only of sanitized commit summaries and PR titles. We enforce prompt injection filters and do not allow your proprietary commit data to be used for model training.
          </p>
        </section>

        <section className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <h2 className="text-base font-bold text-white">3. Data Retention & Tenant Isolation</h2>
          <p>
            All multi-tenant records are segregated with PostgreSQL Row Level Security (RLS). You can disconnect your repositories and delete your workspace data at any time via the Project Settings dashboard.
          </p>
        </section>
      </main>
    </div>
  )
}
