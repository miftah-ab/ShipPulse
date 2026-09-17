'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Heart,
  Calendar,
  ArrowUpRight,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function AnalyticsPage() {
  const params = useParams()
  const projectSlug = (params?.projectSlug as string) || 'demo'
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Changelog Pageviews</span>
              <Eye className="h-4 w-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-white">14,820</p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              <span>+18.4% vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Widget Drawer Opens</span>
              <BarChart3 className="h-4 w-4 text-violet-400" />
            </div>
            <p className="text-2xl font-bold text-white">8,340</p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              <span>+24.1% vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Active Subscribers</span>
              <Users className="h-4 w-4 text-pink-400" />
            </div>
            <p className="text-2xl font-bold text-white">1,248</p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              <span>+62 new this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Total Reactions</span>
              <Heart className="h-4 w-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-white">942</p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              <span>96.2% positive sentiment</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Releases Table */}
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
                  <th className="pb-3">Release Version</th>
                  <th className="pb-3">Title</th>
                  <th className="pb-3">Pageviews</th>
                  <th className="pb-3">Widget Opens</th>
                  <th className="pb-3">Reactions</th>
                  <th className="pb-3 text-right">Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="py-3 font-mono font-semibold text-indigo-400">v2.4.0</td>
                  <td className="py-3 text-white font-medium">Automated Team Seat Billing & Edge Reliability</td>
                  <td className="py-3 text-slate-300">6,120</td>
                  <td className="py-3 text-slate-300">3,490</td>
                  <td className="py-3 text-slate-300">89</td>
                  <td className="py-3 text-right text-emerald-400 font-medium">32.4%</td>
                </tr>
                <tr>
                  <td className="py-3 font-mono font-semibold text-indigo-400">v2.3.1</td>
                  <td className="py-3 text-white font-medium">PostgreSQL Connection Pooling Optimizations</td>
                  <td className="py-3 text-slate-300">4,810</td>
                  <td className="py-3 text-slate-300">2,610</td>
                  <td className="py-3 text-slate-300">45</td>
                  <td className="py-3 text-right text-emerald-400 font-medium">28.1%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
