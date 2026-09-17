'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  GitBranch,
  Bell,
  Code2,
  CheckCircle2,
  ArrowRight,
  Zap,
  Globe,
  Send,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  Terminal,
  Layers,
  Radio,
  Share2,
  Users,
  Check,
  Star,
  Play
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'raw' | 'ai'>('ai')
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  const toggleFaq = (idx: number) => {
    setFaqOpen(faqOpen === idx ? null : idx)
  }

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/60 to-indigo-900/60 border-b border-indigo-500/20 px-4 py-2 text-center text-xs font-medium text-indigo-300 flex items-center justify-center gap-2 backdrop-blur-sm">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>ShipPulse 2.0 is live: Native OpenRouter + Groq dual-engine fallback & zero-config widgets</span>
        <Link href="#pricing" className="underline underline-offset-4 hover:text-white transition-colors ml-1">
          Explore plans &rarr;
        </Link>
      </div>

      {/* 2. NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0A0D14]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                ShipPulse
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
              <Link href="#features" className="hover:text-slate-200 transition-colors">Features</Link>
              <Link href="#how-it-works" className="hover:text-slate-200 transition-colors">How it works</Link>
              <Link href="#widget" className="hover:text-slate-200 transition-colors">Widget</Link>
              <Link href="#pricing" className="hover:text-slate-200 transition-colors">Pricing</Link>
              <Link href="#faq" className="hover:text-slate-200 transition-colors">FAQ</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/onboarding">
              <Button size="sm" variant="glow" className="flex items-center gap-2">
                <span>Start Free</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 3. HERO SECTION */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-600/10 blur-[130px] pointer-events-none rounded-full" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Autonomous Release Notes from Git Commits</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.15] mb-6">
            Turn GitHub Commits into <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Customer-Facing Changelogs
            </span>{' '}
            in Seconds.
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            ShipPulse ingests your GitHub repositories, clusters pull requests, filters internal churn, and drafts beautifully structured release notes, email blasts, and in-app widget notifications automatically.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/onboarding" className="w-full sm:w-auto">
              <Button size="lg" variant="glow" className="w-full h-12 px-8 text-base font-semibold flex items-center gap-2 justify-center">
                <GitBranch className="h-5 w-5" />
                Connect GitHub Repository
              </Button>
            </Link>
            <Link href="#demo" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full h-12 px-8 text-base border-slate-700 hover:bg-slate-800 flex items-center gap-2 justify-center">
                <Play className="h-4 w-4 fill-current" />
                Watch 60s Demo
              </Button>
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-slate-800/80 max-w-4xl mx-auto">
            <div>
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-xs text-slate-400 mt-0.5">Automated commit grouping</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-400">&lt; 3 sec</p>
              <p className="text-xs text-slate-400 mt-0.5">Release draft generation</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">4 Modes</p>
              <p className="text-xs text-slate-400 mt-0.5">Public, Executive, Email, Widget</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">99.9%</p>
              <p className="text-xs text-slate-400 mt-0.5">Dual-provider LLM uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE BEFORE/AFTER DEMO */}
      <section id="demo" className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-3 text-xs">Transformation Engine</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold">See What ShipPulse Does With Your Git History</h2>
          <p className="text-slate-400 text-sm mt-2">Toggle between raw commit chaos and clean customer intelligence.</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-slate-500 ml-2 font-mono">repo: acme/dashboard @ branch: main</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveTab('raw')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'raw' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Raw Commits (Before)
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === 'ai' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                ShipPulse Output (After)
              </button>
            </div>
          </div>

          {/* Content Pane */}
          <div className="p-6">
            {activeTab === 'raw' ? (
              <div className="font-mono text-xs text-slate-300 space-y-2.5 bg-slate-950 p-5 rounded-xl border border-slate-850">
                <p className="text-slate-500"># Git log 7 commits since v2.3.0</p>
                <p><span className="text-amber-400">commit 8a1f2b</span> fix typo in db query handler</p>
                <p><span className="text-amber-400">commit 9c4d1e</span> chore: bump deps and update lockfile</p>
                <p><span className="text-amber-400">commit 1b7a8c</span> refactor: clean up billing controller auth token cache</p>
                <p><span className="text-amber-400">commit 3e9d4a</span> feat(stripe): implement team seat usage billing tier v2</p>
                <p><span className="text-amber-400">commit 6f0e2b</span> fix: make sure webhook signature validation passes on edge</p>
                <p><span className="text-amber-400">commit 7d1c3a</span> temp commit: test fix in staging</p>
                <p><span className="text-amber-400">commit 2a8b9f</span> Merge pull request #142 from acme/feature/seat-billing</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white">v2.4.0 — Flexible Seat Billing & Edge Reliability</span>
                    <Badge variant="feature">New Features</Badge>
                    <Badge variant="fix">Bug Fixes</Badge>
                  </div>
                  <span className="text-xs text-slate-400">Published Sep 13, 2026</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  This release introduces automated team seat calculations with tiered volume discounts, alongside enhanced edge webhook reliability for instant payment reconciliation.
                </p>
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-300">
                      <strong className="text-white">Dynamic Team Seat Billing:</strong> Workspaces can now assign licenses on the fly, with automated prorated invoicing at the billing cycle end.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-300">
                      <strong className="text-white">Edge Webhook Verification:</strong> Webhook listeners now execute in under 12ms across 35 globally distributed regions.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. 4-STEP WORKFLOW */}
      <section id="how-it-works" className="py-20 border-t border-slate-800/60 bg-slate-950/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-3">Automated Pipeline</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">How ShipPulse Works</h2>
            <p className="text-slate-400 mt-3 text-base">From git push to customer engagement without manual copywriting overhead.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card className="border-slate-800 bg-slate-900/60">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <h3 className="text-base font-semibold text-white">Connect GitHub</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Link public or private repositories via OAuth or GitHub Webhooks with granular read-only access.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/60">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <h3 className="text-base font-semibold text-white">AI Change Intelligence</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our LLM cluster filters out internal chores and classifies work into features, bug fixes, performance, and breaking changes.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/60">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <h3 className="text-base font-semibold text-white">Review & Edit</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Refine drafts with the rich Markdown editor or one-click regenerate tones (Casual, Technical, Executive, Bulleted).
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/60">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-lg">
                  4
                </div>
                <h3 className="text-base font-semibold text-white">Multi-Channel Publish</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  One click syncs your hosted changelog, embeds into your app widget, sends Resend email updates, and notifies Slack/Discord.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. CORE FEATURE MATRIX */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-3">Feature Complete</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Everything Needed for Modern Product Comms</h2>
          <p className="text-slate-400 mt-3 text-base">Built specifically for engineering-led product teams and fast-shipping startups.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-colors">
            <CardContent className="p-6 space-y-3">
              <Radio className="h-6 w-6 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">Embeddable In-App Widget</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero-bundle pollution. Shadow DOM isolated script runs anywhere (React, Vue, plain HTML) with unread badges, popovers, and slideouts.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-colors">
            <CardContent className="p-6 space-y-3">
              <Send className="h-6 w-6 text-violet-400" />
              <h3 className="text-lg font-semibold text-white">Automated Subscriber Emails</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Allow users to subscribe to updates. Send branded HTML release roundups via Resend with unsubscribe tokens and spam controls.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-colors">
            <CardContent className="p-6 space-y-3">
              <MessageSquare className="h-6 w-6 text-pink-400" />
              <h3 className="text-lg font-semibold text-white">Sentiment & User Feedback</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Track whether users found releases helpful. Gather emoji reactions and comments to measure feature reception in real-time.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-colors">
            <CardContent className="p-6 space-y-3">
              <Globe className="h-6 w-6 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Hosted Changelog & Custom Domains</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                High-speed SEO-optimized changelog pages on your custom subdomain (updates.yourcompany.com) with automatic SSL and RSS/Atom feeds.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-colors">
            <CardContent className="p-6 space-y-3">
              <Share2 className="h-6 w-6 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Slack, Discord & Webhook Relays</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Broadcast new releases instantly to internal team Slack channels, Discord community servers, or custom HMAC-signed webhooks.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-colors">
            <CardContent className="p-6 space-y-3">
              <ShieldCheck className="h-6 w-6 text-amber-400" />
              <h3 className="text-lg font-semibold text-white">Enterprise Security & Multi-Tenancy</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                PostgreSQL Row Level Security (RLS) on all 25+ tables, API key hashing, prompt injection guardrails, and audit logging.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 7. WIDGET SPOTLIGHT */}
      <section id="widget" className="py-20 border-t border-slate-800/60 bg-gradient-to-b from-transparent via-slate-950/60 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="feature">In-App Notification Center</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Deliver updates right where your users are.
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Embed ShipPulse into your SaaS in under 60 seconds with a single script tag. The widget uses isolated Shadow DOM styling so your app’s CSS never breaks the changelog drawer.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Unread release notification badge counter</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Supports Floating Button, Header Pill, or Custom Selector</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Client-side programmatic API: <code>ShipPulse.open()</code></span>
                </div>
              </div>
            </div>

            {/* Simulated Widget UI */}
            <div className="relative">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-indigo-400" />
                    <span className="font-semibold text-sm text-white">What&apos;s New</span>
                  </div>
                  <span className="text-[11px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-medium">3 unread</span>
                </div>

                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-white">Command Bar v2 (⌘K)</span>
                      <span className="text-[10px] text-slate-500">2h ago</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Jump anywhere in the workspace with fuzzy keyboard navigation and automated quick filters.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-white">PostgreSQL Connection Pooling</span>
                      <span className="text-[10px] text-slate-500">1d ago</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Reduced database query latency by 48% across all multi-tenant API routes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PRICING TIERS */}
      <section id="pricing" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-3">Transparent Pricing</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Simple Plans That Scale With You</h2>
          <p className="text-slate-400 mt-3 text-base">Start for free and upgrade as your shipping velocity expands.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* FREE TIER */}
          <Card className="border-slate-800 bg-slate-900/50 flex flex-col justify-between">
            <CardContent className="p-8">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white">Free Starter</h3>
                <p className="text-xs text-slate-400 mt-1">For side projects and open source.</p>
              </div>
              <div className="my-6">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-xs text-slate-400"> / forever</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400" />
                  <span>1 Project & 1 GitHub Repository</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400" />
                  <span>5 AI Release Generations / mo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400" />
                  <span>Hosted Public Changelog</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400" />
                  <span>Embeddable Widget (ShipPulse watermark)</span>
                </li>
              </ul>
            </CardContent>
            <div className="p-8 pt-0">
              <Link href="/onboarding" className="w-full">
                <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </Card>

          {/* PRO TIER */}
          <Card className="border-indigo-500/50 bg-slate-900/90 relative shadow-2xl shadow-indigo-500/10 flex flex-col justify-between">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full text-[11px] font-bold text-white uppercase tracking-wider">
              Most Popular
            </div>
            <CardContent className="p-8">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white">Pro</h3>
                <p className="text-xs text-slate-400 mt-1">For growing startups and production SaaS.</p>
              </div>
              <div className="my-6">
                <span className="text-4xl font-extrabold text-white">$29</span>
                <span className="text-xs text-slate-400"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400" />
                  <span>3 Projects & Unlimited Repositories</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400" />
                  <span>Unlimited AI Release Generations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400" />
                  <span>Custom Domain (updates.yourdomain.com)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400" />
                  <span>White-label Widget (no watermark)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400" />
                  <span>Resend Email Broadcasts (1,000 subscribers)</span>
                </li>
              </ul>
            </CardContent>
            <div className="p-8 pt-0">
              <Link href="/onboarding" className="w-full">
                <Button variant="glow" className="w-full">
                  Start 14-Day Free Trial
                </Button>
              </Link>
            </div>
          </Card>

          {/* TEAM TIER */}
          <Card className="border-slate-800 bg-slate-900/50 flex flex-col justify-between">
            <CardContent className="p-8">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white">Team & Scale</h3>
                <p className="text-xs text-slate-400 mt-1">For multi-product companies & scale-ups.</p>
              </div>
              <div className="my-6">
                <span className="text-4xl font-extrabold text-white">$79</span>
                <span className="text-xs text-slate-400"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400" />
                  <span>Unlimited Projects & Team Members</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400" />
                  <span>Unlimited Email Subscribers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400" />
                  <span>Public REST API v1 Access + Webhooks</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400" />
                  <span>Dedicated Slack & Discord Relays</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-400" />
                  <span>Full Audit Logs & Priority Support</span>
                </li>
              </ul>
            </CardContent>
            <div className="p-8 pt-0">
              <Link href="/onboarding" className="w-full">
                <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800">
                  Upgrade to Team
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* 9. FAQ ACCORDION */}
      <section id="faq" className="py-20 border-t border-slate-800/60 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-3">Questions & Answers</Badge>
          <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'How does ShipPulse protect our private source code?',
              a: 'ShipPulse only retrieves commit messages, pull request titles, and summarized diff statistics. Your full source files are never read or stored, and LLM prompts are scrubbed of sensitive secrets and API tokens.'
            },
            {
              q: 'Can I edit the release notes before they are published?',
              a: 'Yes, absolutely! ShipPulse automatically creates drafts. You have a full Markdown editor to refine wording, adjust categories, attach images, or regenerate sections in one click before publishing.'
            },
            {
              q: 'How do custom domains work?',
              a: 'On the Pro and Team plans, you can map any CNAME (like changelog.yourdomain.com) directly to your project. We handle automatic SSL certificate issuance and routing.'
            },
            {
              q: 'What AI models power the release generation?',
              a: 'ShipPulse uses a dual-engine architecture: Groq Llama-3.3-70b-versatile for sub-second lightning inference with automatic fallback to OpenRouter, ensuring 99.9% availability.'
            }
          ].map((item, idx) => (
            <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full px-6 py-4 text-left flex items-center justify-between text-sm font-semibold text-white hover:bg-slate-800/40 transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${faqOpen === idx ? 'rotate-180' : ''}`} />
              </button>
              {faqOpen === idx && (
                <div className="px-6 pb-4 pt-1 text-xs text-slate-400 leading-relaxed border-t border-slate-800/40">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/60 to-purple-950/60 p-12 relative overflow-hidden backdrop-blur-xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Stop Wasting Hours Writing Changelogs
            </h2>
            <p className="text-slate-300 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
              Connect your GitHub repository in 60 seconds and let ShipPulse keep your customers informed and excited about every release.
            </p>
            <Link href="/onboarding">
              <Button size="lg" variant="glow" className="h-12 px-8 text-base">
                Get Started for Free Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="border-t border-slate-800/80 py-12 bg-slate-950 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span className="font-semibold text-slate-300">ShipPulse</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link href="/docs" className="hover:text-slate-300 transition-colors">Documentation</Link>
            <Link href="/status" className="hover:text-slate-300 transition-colors">System Status</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
