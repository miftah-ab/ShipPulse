'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Sparkles,
  Rss,
  Mail,
  CheckCircle2,
  Search,
  ThumbsUp,
  Heart,
  Rocket,
  PartyPopper,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type Release = {
  id: string
  version: string | null
  title: string
  publishedAt: string | null
  categories: string[]
  summary: string
  content: string
}

const categoryColors: Record<string, string> = {
  feature: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  fix: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  perf: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  breaking: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  security: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

export default function PublicChangelogPage() {
  const params = useParams()
  const projectSlug = params?.projectSlug as string

  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  const [subscriberEmail, setSubscriberEmail] = useState('')
  const [subscribedSuccess, setSubscribedSuccess] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [reactions, setReactions] = useState<Record<string, number>>({})

  useEffect(() => {
    async function fetchReleases() {
      try {
        setLoading(true)
        const res = await fetch(`/api/public/changelog?projectSlug=${encodeURIComponent(projectSlug)}`)
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        if (res.ok) {
          const data = await res.json()
          setReleases(data.releases || [])
          setProjectName(data.projectName || projectSlug)
        }
      } catch {
        setReleases([])
      } finally {
        setLoading(false)
      }
    }
    if (projectSlug) fetchReleases()
  }, [projectSlug])

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subscriberEmail) return
    try {
      setSubscribing(true)
      const res = await fetch('/api/public/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscriberEmail, projectSlug }),
      })
      if (res.ok) {
        setSubscribedSuccess(true)
        setTimeout(() => {
          setShowSubscribeModal(false)
          setSubscribedSuccess(false)
          setSubscriberEmail('')
        }, 2000)
      }
    } catch {
      // silent
    } finally {
      setSubscribing(false)
    }
  }

  const toggleReaction = async (releaseId: string, emoji: string) => {
    const key = `${releaseId}-${emoji}`
    setReactions((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }))
    try {
      await fetch('/api/public/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ releaseId, emoji }),
      })
    } catch {
      // optimistic, no rollback needed
    }
  }

  const allCategories = ['all', ...Array.from(new Set(releases.flatMap((r) => r.categories)))]

  const filtered = releases.filter((r) => {
    const matchesCategory = activeCategory === 'all' || r.categories.includes(activeCategory)
    const matchesSearch = !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.version || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

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
              <h1 className="font-bold text-base text-white capitalize leading-none">
                {projectName || projectSlug}
              </h1>
              <p className="text-[11px] text-slate-500 leading-none mt-0.5">Release Changelog</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-slate-750 hidden sm:flex"
              onClick={() => setShowSubscribeModal(true)}
            >
              <Mail className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
              Subscribe
            </Button>
            <a
              href={`/${projectSlug}/feed.xml`}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-800 text-slate-500 hover:text-amber-400 hover:border-amber-500/30 transition-colors"
              title="RSS Feed"
            >
              <Rss className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Search + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search release notes..."
              className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Release list */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-slate-500 text-xs">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading changelog...
          </div>
        ) : notFound ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertCircle className="h-10 w-10 text-slate-600 mb-4" />
            <h2 className="text-lg font-bold text-slate-300">Changelog not found</h2>
            <p className="text-xs text-slate-500 mt-2">
              This project does not exist or is not publicly accessible.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Sparkles className="h-10 w-10 text-slate-600 mb-4" />
            <h2 className="text-lg font-bold text-slate-300">
              {releases.length === 0 ? 'No releases yet' : 'No releases match your filter'}
            </h2>
            <p className="text-xs text-slate-500 mt-2 max-w-sm">
              {releases.length === 0
                ? 'The first release will appear here once published.'
                : 'Try changing your search or category filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filtered.map((release) => (
              <Card key={release.id} className="border-slate-800 bg-slate-900/50 overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6 space-y-4">
                    {/* Release header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {release.version && (
                            <span className="font-mono font-bold text-indigo-400 text-sm">
                              {release.version}
                            </span>
                          )}
                          {release.categories.map((cat) => (
                            <Badge
                              key={cat}
                              variant="outline"
                              className={`text-[10px] capitalize ${categoryColors[cat] || ''}`}
                            >
                              {cat}
                            </Badge>
                          ))}
                        </div>
                        <h2 className="text-lg font-bold text-white">{release.title}</h2>
                      </div>
                      {release.publishedAt && (
                        <span className="text-xs text-slate-500 shrink-0">
                          {new Date(release.publishedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>

                    {/* Summary */}
                    {release.summary && (
                      <p className="text-sm text-slate-300 leading-relaxed">{release.summary}</p>
                    )}

                    {/* Content preview */}
                    {release.content && (
                      <div className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap font-mono bg-slate-950/50 rounded-lg p-4 border border-slate-800">
                        {release.content.slice(0, 500)}{release.content.length > 500 ? '...' : ''}
                      </div>
                    )}

                    {/* Reactions */}
                    <div className="flex items-center gap-3 pt-1">
                      {(['👍', '🚀', '🎉', '❤️'] as const).map((emoji) => {
                        const key = `${release.id}-${emoji}`
                        return (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(release.id, emoji)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all text-xs text-slate-400 hover:text-slate-200"
                          >
                            <span>{emoji}</span>
                            <span className="tabular-nums">{reactions[key] || 0}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Subscribe modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <Card className="w-full max-w-sm border-slate-800 bg-slate-900 shadow-2xl">
            <CardContent className="p-6 space-y-4">
              {subscribedSuccess ? (
                <div className="text-center space-y-2 py-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                  <p className="font-semibold text-white">You're subscribed!</p>
                  <p className="text-xs text-slate-400">
                    You'll receive email updates for new releases.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="font-bold text-white">Get Release Updates</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Subscribe to receive email notifications when new releases are published.
                    </p>
                  </div>
                  <form onSubmit={handleSubscribe} className="space-y-3">
                    <input
                      type="email"
                      placeholder="you@company.com"
                      value={subscriberEmail}
                      onChange={(e) => setSubscriberEmail(e.target.value)}
                      required
                      className="h-9 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setShowSubscribeModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="glow"
                        size="sm"
                        className="flex-1 text-xs font-semibold"
                        disabled={subscribing}
                      >
                        {subscribing ? 'Subscribing...' : 'Subscribe'}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
