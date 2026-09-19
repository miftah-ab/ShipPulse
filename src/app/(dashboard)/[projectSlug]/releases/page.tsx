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
  const [searchQuery, setSearchQuery] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [releases, setReleases] = useState<any[]>([])

  const fetchReleases = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/dashboard/releases?projectSlug=${encodeURIComponent(projectSlug)}`)
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login'
          return
        }
        throw new Error('Failed to fetch project releases')
      }
      const data = await res.json()
      setReleases(data.releases || [])
    } catch (err: any) {
      setError('Unable to load releases. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [projectSlug])

  React.useEffect(() => {
    fetchReleases()
  }, [fetchReleases])

  const filteredReleases = releases.filter((r) => {
    const matchesFilter = filter === 'all' || r.status === filter
    const matchesSearch = !searchQuery || 
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.version?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.summary?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const triggerAiSync = async () => {
    try {
      setIsSyncing(true)
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectSlug }),
      })
      if (!res.ok) {
        throw new Error('Sync failed')
      }
      await fetchReleases()
    } catch {
      // Refresh to ensure any partial sync is reflected
      await fetchReleases()
    } finally {
      setIsSyncing(false)
    }
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter releases..."
            className="h-8 w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={fetchReleases} className="h-7 text-[11px]">
            Retry
          </Button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 rounded-xl border border-slate-800/80 bg-slate-900/30 animate-pulse" />
          ))}
        </div>
      ) : (
        /* Releases List */
        <div className="space-y-3">
          {filteredReleases.map((release) => (
            <Card key={release.id} className="border-slate-800 bg-slate-900/50 hover:border-slate-750 transition-all">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {release.version && (
                      <>
                        <span className="font-mono text-xs font-semibold text-indigo-400">{release.version}</span>
                        <span className="text-slate-600">&bull;</span>
                      </>
                    )}
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

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{release.summary || 'No summary provided.'}</p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <span>{release.published_at ? `Published on ${new Date(release.published_at).toLocaleDateString()}` : 'Not yet published'}</span>
                    <span>&bull;</span>
                    <span>{release.views_count ?? 0} views</span>
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
              <Link href={`/${projectSlug}/releases/new`}>
                <Button size="sm" variant="glow" className="mt-4">
                  Create First Release
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
