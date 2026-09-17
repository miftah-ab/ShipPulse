import React from 'react'
import Link from 'next/link'
import { Sparkles, ArrowLeft, Terminal, Radio, Code2, ShieldCheck, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      <header className="border-b border-slate-800/80 bg-[#0A0D14]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-base text-white">ShipPulse Docs</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation */}
        <aside className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Guides</div>
          <nav className="space-y-1 text-xs">
            <a href="#quickstart" className="block p-2 rounded-lg bg-indigo-600/10 text-indigo-400 font-semibold">
              Quickstart Guide
            </a>
            <a href="#widget" className="block p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900">
              Embeddable Widget
            </a>
            <a href="#api" className="block p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900">
              REST API v1
            </a>
            <a href="#webhooks" className="block p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900">
              Webhooks & Relays
            </a>
          </nav>
        </aside>

        {/* Content */}
        <div className="md:col-span-3 space-y-12">
          {/* Section 1: Quickstart */}
          <section id="quickstart" className="space-y-4">
            <Badge variant="outline">Overview</Badge>
            <h1 className="text-2xl font-bold text-white">Getting Started with ShipPulse</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              ShipPulse automates product communication by transforming raw GitHub commits and merged PRs into polished release notes, hosted changelogs, in-app widgets, and multi-channel notifications.
            </p>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
              <p className="font-semibold text-white">1. Link your GitHub repository</p>
              <p className="text-slate-400">Add our webhook or authenticate with read-only commit and PR permissions.</p>
              <p className="font-semibold text-white pt-2">2. Review your AI-generated draft</p>
              <p className="text-slate-400">Our LLM pipeline aggregates commits, filters noise, and groups changes.</p>
              <p className="font-semibold text-white pt-2">3. Publish across your ecosystem</p>
              <p className="text-slate-400">One click syncs your public changelog, in-app drawer, and email subscribers.</p>
            </div>
          </section>

          {/* Section 2: Embeddable Widget */}
          <section id="widget" className="space-y-4">
            <Badge variant="feature">In-App Notification</Badge>
            <h2 className="text-xl font-bold text-white">Embedding the Widget</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Add the following snippet before the closing <code className="text-indigo-400 font-mono">&lt;/body&gt;</code> tag. It utilizes Shadow DOM to prevent any CSS collision with your app.
            </p>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto">
{`<script
  src="https://shippulse.app/widget.js"
  data-project="your-project-slug"
  defer
></script>`}
            </pre>
          </section>

          {/* Section 3: REST API v1 */}
          <section id="api" className="space-y-4">
            <Badge variant="fix">REST API</Badge>
            <h2 className="text-xl font-bold text-white">Public REST API (v1)</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Authenticate via the <code className="text-indigo-400 font-mono">Authorization: Bearer &lt;API_KEY&gt;</code> header.
            </p>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">GET</span>
                <span className="text-slate-200">/api/v1/releases</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-indigo-400 font-bold">POST</span>
                <span className="text-slate-200">/api/v1/releases</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
