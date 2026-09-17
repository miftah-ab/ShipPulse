'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Sparkles,
  Rss,
  Mail,
  Share2,
  CheckCircle2,
  Search,
  ThumbsUp,
  Heart,
  Rocket,
  PartyPopper,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

export default function PublicChangelogPage() {
  const params = useParams()
  const projectSlug = (params?.projectSlug as string) || 'demo'

  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  const [subscriberEmail, setSubscriberEmail] = useState('')
  const [subscribedSuccess, setSubscribedSuccess] = useState(false)

  // Interactive reactions state
  const [reactions, setReactions] = useState<{ [key: string]: number }>({
    'rel-1-like': 42,
    'rel-1-rocket': 28,
    'rel-1-party': 19,
    'rel-2-like': 15,
    'rel-2-rocket': 9,
  })

  const toggleReaction = (key: string) => {
    setReactions((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }))
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subscriberEmail) return
    setSubscribedSuccess(true)
    setTimeout(() => {
      setShowSubscribeModal(false)
      setSubscribedSuccess(false)
      setSubscriberEmail('')
    }, 2000)
  }

  const releases = [
    {
      id: 'rel-1',
      version: 'v2.4.0',
      title: 'Automated Team Seat Billing & Edge Reliability',
      date: 'September 13, 2026',
      categories: ['feature', 'fix'],
      summary: 'Dynamic team seat volume calculation, edge webhook execution in <12ms, and minor UI accessibility improvements.',
      details: [
        'Team Seat Scaling: Administrators can now provision seats on demand without interruptions.',
        'Edge HMAC Verification: Webhooks listeners now verify SHA-256 signatures in under 12ms.',
        'PostgreSQL Pooling: Stabilized connection pools across high concurrency traffic spikes.'
      ]
    },
    {
      id: 'rel-2',
      version: 'v2.3.1',
      title: 'PostgreSQL Connection Pooling Optimizations',
      date: 'September 06, 2026',
      categories: ['perf'],
      summary: 'Reduced latency across multi-tenant database queries and fixed SSL keep-alive connections.',
      details: [
        'Cut query roundtrip time by 34% on read-heavy analytics dashboards.',
        'Added automated keep-alive pings to avoid cold starts.'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0A0D14]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white capitalize leading-none">{projectSlug}</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Product Changelog & Updates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/api/public/${projectSlug}/rss`} target="_blank">
              <Button variant="outline" size="sm" className="h-8 text-xs border-slate-800 hover:bg-slate-800">
                <Rss className="h-3.5 w-3.5 text-amber-400 mr-1.5" />
                RSS
              </Button>
            </Link>

            <Button
              variant="glow"
              size="sm"
              onClick={() => setShowSubscribeModal(true)}
              className="h-8 text-xs font-semibold"
            >
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              Subscribe
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* Intro / Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Product Releases</h2>
            <p className="text-xs text-slate-400 mt-1">
              Follow along with every enhancement, bug fix, and feature we deploy.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search release notes..."
              className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="relative border-l border-slate-800 ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-12">
          {releases.map((rel) => (
            <article key={rel.id} className="relative group">
              {/* Timeline marker node */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 h-4 w-4 rounded-full bg-indigo-600 border-4 border-[#0A0D14] ring-2 ring-indigo-500/40 group-hover:scale-125 transition-transform" />

              <div className="space-y-4">
                {/* Meta line */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {rel.version}
                  </span>
                  <span className="text-xs text-slate-500">{rel.date}</span>
                  {rel.categories.map((c) => (
                    <Badge key={c} variant={c as any} className="text-[10px]">
                      {c}
                    </Badge>
                  ))}
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight hover:text-indigo-300 transition-colors">
                  {rel.title}
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed">{rel.summary}</p>

                {/* Details list */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                  {rel.details.map((d, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>

                {/* Reactions and Share */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleReaction(`${rel.id}-like`)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      <span>{reactions[`${rel.id}-like`] || 0}</span>
                    </button>
                    <button
                      onClick={() => toggleReaction(`${rel.id}-rocket`)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      <Rocket className="h-3 w-3 text-violet-400" />
                      <span>{reactions[`${rel.id}-rocket`] || 0}</span>
                    </button>
                    <button
                      onClick={() => toggleReaction(`${rel.id}-party`)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      <PartyPopper className="h-3 w-3 text-amber-400" />
                      <span>{reactions[`${rel.id}-party`] || 0}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href)
                    }}
                    className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-900 transition-colors"
                    title="Copy release link"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <Card className="w-full max-w-md border-slate-800 bg-slate-900 shadow-2xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-indigo-400" />
                  <h3 className="font-semibold text-base text-white">Subscribe to Releases</h3>
                </div>
                <button
                  onClick={() => setShowSubscribeModal(false)}
                  className="text-slate-500 hover:text-slate-300 text-sm"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Get an email as soon as we publish new features and product updates. No spam, ever.
              </p>

              {subscribedSuccess ? (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium text-center">
                  Check your inbox to confirm your subscription!
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    value={subscriberEmail}
                    onChange={(e) => setSubscriberEmail(e.target.value)}
                    required
                    className="bg-slate-950 border-slate-800 text-xs"
                  />
                  <Button type="submit" variant="glow" className="w-full text-xs">
                    Confirm Subscription
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Public Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>
          Powered by{' '}
          <Link href="/" className="font-semibold text-indigo-400 hover:underline">
            ShipPulse
          </Link>{' '}
          &bull; AI Product Communication
        </p>
      </footer>
    </div>
  )
}
