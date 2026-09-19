'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Heart,
  PartyPopper,
  RefreshCw,
  ShieldCheck
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type FeedbackItem = {
  id: string
  releaseTitle?: string
  releaseVersion?: string
  text: string
  rating?: string
  reaction?: string
  createdAt: string
}

export default function FeedbackPage() {
  const params = useParams()
  const projectSlug = params?.projectSlug as string

  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, helpful: 0, unhelpful: 0, reactions: 0 })

  useEffect(() => {
    async function fetchFeedback() {
      try {
        setLoading(true)
        const res = await fetch(`/api/public/feedback?projectSlug=${encodeURIComponent(projectSlug)}`)
        if (res.ok) {
          const data = await res.json()
          const items: FeedbackItem[] = data.feedback || []
          setFeedback(items)
          const helpful = items.filter((f) => f.rating === 'helpful').length
          const unhelpful = items.filter((f) => f.rating === 'unhelpful').length
          const reactions = items.filter((f) => f.reaction).length
          setStats({ total: items.length, helpful, unhelpful, reactions })
        }
      } catch {
        setFeedback([])
      } finally {
        setLoading(false)
      }
    }
    if (projectSlug) fetchFeedback()
  }, [projectSlug])

  const helpfulRatio = stats.total > 0 ? Math.round((stats.helpful / stats.total) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Feedback & Reactions</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review customer sentiment, release reactions, and direct qualitative comments.
        </p>
      </div>

      {/* Sentiment Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Helpful Ratio</span>
              <ThumbsUp className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{helpfulRatio}%</p>
            <p className="text-[11px] text-slate-500 mt-1">{stats.helpful} helpful vs {stats.unhelpful} unhelpful</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Total Reactions</span>
              <Heart className="h-4 w-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.reactions}</p>
            <p className="text-[11px] text-slate-500 mt-1">Emoji reactions across all releases</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Total Comments</span>
              <MessageSquare className="h-4 w-4 text-violet-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            <p className="text-[11px] text-slate-500 mt-1">Across all published releases</p>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Items */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base">Recent Feedback</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Live comments and reactions submitted by your users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-500 text-xs">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading feedback...
            </div>
          ) : feedback.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShieldCheck className="h-8 w-8 text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-300">No feedback yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                User comments and reactions will appear here once your changelog is live and visited.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {item.reaction && (
                        <span className="text-lg">{item.reaction}</span>
                      )}
                      {item.releaseVersion && (
                        <Badge variant="outline" className="text-[10px] font-mono text-indigo-400 border-indigo-500/30">
                          {item.releaseVersion}
                        </Badge>
                      )}
                      {item.releaseTitle && (
                        <span className="text-xs text-slate-400 truncate max-w-xs">{item.releaseTitle}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">{item.createdAt}</span>
                  </div>
                  {item.text && (
                    <p className="text-xs text-slate-300 leading-relaxed">{item.text}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
