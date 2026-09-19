'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Heart,
  RefreshCw,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

type AnalyticsData = {
  pageviews: number
  widgetOpens: number
  subscribers: number
  reactions: number
  topReleases: Array<{
    version: string
    title: string
    pageviews: number
    widgetOpens: number
    reactions: number
    engagementRate: string
  }>
}

export default function AnalyticsPage() {
  const params = useParams()
  const projectSlug = params?.projectSlug as string

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true)
        const res = await fetch(
          `/api/dashboard/analytics?projectSlug=${encodeURIComponent(projectSlug)}&range=${timeRange}`
        )
        if (res.ok) {
          const json = await res.json()
          setData(json)
        } else {
          setData(null)
        }
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    if (projectSlug) fetchAnalytics()
  }, [projectSlug, timeRange])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics & Reach</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track user engagement, widget drawer opens, and release reaction metrics.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {(['7d', '30d', '90d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase transition-colors ${
                timeRange === r ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-slate-500 text-xs">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading analytics...
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Sparkles className="h-8 w-8 text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-300">No analytics data yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Analytics will populate once you publish releases and users start viewing your changelog.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-800 bg-slate-900/50">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Changelog Pageviews</span>
                  <Eye className="h-4 w-4 text-indigo-400" />
                </div>
                <p className="text-2xl font-bold text-white">{data.pageviews.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Widget Drawer Opens</span>
                  <BarChart3 className="h-4 w-4 text-violet-400" />
                </div>
                <p className="text-2xl font-bold text-white">{data.widgetOpens.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Active Subscribers</span>
                  <Users className="h-4 w-4 text-pink-400" />
                </div>
                <p className="text-2xl font-bold text-white">{data.subscribers.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Total Reactions</span>
                  <Heart className="h-4 w-4 text-rose-400" />
                </div>
                <p className="text-2xl font-bold text-white">{data.reactions.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Releases Table */}
          {data.topReleases && data.topReleases.length > 0 && (
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-base">Top Performing Releases</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Releases ranked by combined pageviews, widget drawer impressions, and user reactions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-medium">
                        <th className="pb-3">Version</th>
                        <th className="pb-3">Title</th>
                        <th className="pb-3">Pageviews</th>
                        <th className="pb-3">Widget Opens</th>
                        <th className="pb-3">Reactions</th>
                        <th className="pb-3 text-right">Engagement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {data.topReleases.map((release, i) => (
                        <tr key={i}>
                          <td className="py-3 font-mono font-semibold text-indigo-400">{release.version}</td>
                          <td className="py-3 text-white font-medium">{release.title}</td>
                          <td className="py-3 text-slate-300">{release.pageviews.toLocaleString()}</td>
                          <td className="py-3 text-slate-300">{release.widgetOpens.toLocaleString()}</td>
                          <td className="py-3 text-slate-300">{release.reactions}</td>
                          <td className="py-3 text-right text-emerald-400 font-medium">{release.engagementRate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
