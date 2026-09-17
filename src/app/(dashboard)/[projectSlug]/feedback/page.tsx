'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Rocket,
  Heart,
  PartyPopper,
  Filter,
  ShieldCheck
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function FeedbackPage() {
  const params = useParams()
  const projectSlug = (params?.projectSlug as string) || 'demo'

  const comments = [
    {
      id: '1',
      release: 'v2.4.0',
      text: 'The dynamic seat billing solved our exact headache with onboarding freelancers mid-cycle. Huge win!',
      rating: 'helpful',
      reaction: '🚀',
      date: '2 hours ago',
      author: 'Anonymous visitor (US)',
    },
    {
      id: '2',
      release: 'v2.4.0',
      text: 'Can you guys add support for multiple webhook endpoints per project next?',
      rating: 'helpful',
      reaction: '👍',
      date: '5 hours ago',
      author: 'Anonymous visitor (EU)',
    },
    {
      id: '3',
      release: 'v2.3.1',
      text: 'Noticeably faster dashboard load times on mobile. Thanks for the pooling upgrade.',
      rating: 'helpful',
      reaction: '🎉',
      date: '3 days ago',
      author: 'Verified Subscriber',
    },
  ]

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
            <p className="text-2xl font-bold text-emerald-400 mt-1">97.8%</p>
            <p className="text-[11px] text-slate-500 mt-1">456 helpful vs 10 unhelpful</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Total Reactions</span>
              <Heart className="h-4 w-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">1,492</p>
            <p className="text-[11px] text-slate-500 mt-1">Across 8 published releases</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Spam Shield</span>
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-indigo-400 mt-1">100% Active</p>
            <p className="text-[11px] text-slate-500 mt-1">IP rate-limits & honeypot enabled</p>
          </CardContent>
        </Card>
      </div>

      {/* Comments List */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base">Customer Comments Stream</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Real feedback submitted by users reading your changelog and in-app widget.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="feature" className="text-[10px] font-mono">{c.release}</Badge>
                  <span className="text-slate-400">{c.author}</span>
                </div>
                <span className="text-slate-500 text-[11px]">{c.date}</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">&ldquo;{c.text}&rdquo;</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                  {c.reaction} Reaction
                </span>
                <span className="text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-emerald-400">
                  Marked Helpful
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
