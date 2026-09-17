'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Sparkles,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Archive,
  Eye,
  Edit3,
  Filter,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default function ReleasesPage() {
  const params = useParams()
  const projectSlug = (params?.projectSlug as string) || 'demo'
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'generated'>('all')
  const [isSyncing, setIsSyncing] = useState(false)

  // Example real release items
  const [releases, setReleases] = useState([
    {
      id: 'rel-1',
      version: 'v2.4.0',
      title: 'Automated Team Seat Billing & Edge Reliability',
      slug: 'v2-4-0-seat-billing',
      status: 'published',
      publishedAt: 'Sep 13, 2026',
      categories: ['feature', 'fix'],
      summary: 'Dynamic team seat volume calculation, edge webhook execution in <12ms, and minor UI accessibility improvements.',
      sourceCount: 8,
    },
    {
      id: 'rel-2',
      version: 'v2.3.1',
      title: 'PostgreSQL Connection Pooling Optimizations',
      slug: 'v2-3-1-pg-pooling',
      status: 'published',
      publishedAt: 'Sep 06, 2026',
      categories: ['perf'],
      summary: 'Reduced latency across multi-tenant database queries and fixed SSL keep-alive connections.',
      sourceCount: 3,
    },
    {
      id: 'rel-3',
      version: 'v2.5.0-draft',
      title: 'AI Tone Adjustment & Slack Interactive Relays',
      slug: 'v2-5-0-slack-relays',
      status: 'generated',
      publishedAt: null,
      categories: ['feature'],
      summary: 'Synthesized from 12 recent commits: One-click executive summary rewrite and real-time Slack release broadcast.',
      sourceCount: 12,
    },
  ])

  const filteredReleases = releases.filter((r) => {
    if (filter === 'all') return true
    return r.status === filter
  })

  const triggerAiSync = () => {
    setIsSyncing(true)
    setTimeout(() => {
      setIsSyncing(false)
      // Add newly synthesized release
      const newRel = {
        id: `rel-${Date.now()}`,
        version: 'v2.5.1-auto',
        title: 'Security Auditing & HMAC Webhook Verification',
        slug: 'v2-5-1-security-auditing',
        status: 'generated',
        publishedAt: null,
        categories: ['security', 'fix'],
        summary: 'Synthesized from 4 recent commits: SHA-256 HMAC header verification on incoming GitHub webhooks.',
        sourceCount: 4,
      }
      setReleases((prev) => [newRel, ...prev])
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Releases</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your customer-facing changelog, review AI drafts, and publish updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={triggerAiSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 h-9 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{isSyncing ? 'Syncing Git...' : 'Run AI Sync'}</span>
          </Button>

          <Link href={`/${projectSlug}/releases/new`}>
            <Button size="sm" variant="glow" className="flex items-center gap-1.5 h-9 text-xs font-semibold">
              <Plus className="h-3.5 w-3.5" />
              <span>Create Release</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          {(['all', 'published', 'draft', 'generated'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter releases..."
            className="h-8 w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Releases List */}
      <div className="space-y-3">
        {filteredReleases.map((release) => (
          <Card key={release.id} className="border-slate-800 bg-slate-900/50 hover:border-slate-750 transition-all">
            <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-indigo-400">{release.version}</span>
                  <span className="text-slate-600">&bull;</span>
                  <h3 className="text-sm font-semibold text-white">{release.title}</h3>
                  <Badge
                    variant={
                      release.status === 'published'
                        ? 'feature'
                        : release.status === 'generated'
                        ? 'fix'
                        : 'secondary'
                    }
                    className="capitalize text-[10px]"
                  >
                    {release.status}
                  </Badge>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{release.summary}</p>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span>{release.publishedAt ? `Published on ${release.publishedAt}` : 'Not yet published'}</span>
                  <span>&bull;</span>
                  <span>{release.sourceCount} linked Git commits/PRs</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/${projectSlug}/releases/${release.id}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs border-slate-750 hover:bg-slate-800">
                    <Edit3 className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    Edit
                  </Button>
                </Link>

                {release.status === 'published' && (
                  <Link href={`/${projectSlug}/${release.slug}`} target="_blank">
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-400 hover:text-white">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredReleases.length === 0 && (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl">
            <Sparkles className="h-8 w-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">No releases found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Run an AI sync to automatically group your recent commits, or create a release draft manually.
            </p>
            <Button size="sm" variant="glow" onClick={triggerAiSync} className="mt-4">
              Run First AI Sync
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
