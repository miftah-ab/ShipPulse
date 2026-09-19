import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Sparkles, ArrowLeft, CheckCircle2, ThumbsUp, Rocket, PartyPopper } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function SingleReleasePage({
  params,
}: {
  params: Promise<{ projectSlug: string; releaseSlug: string }>
}) {
  const { projectSlug, releaseSlug } = await params

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      <header className="border-b border-slate-800/80 bg-[#0A0D14]/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href={`/${projectSlug}`} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to {projectSlug} changelog</span>
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm text-white">ShipPulse</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
              Release
            </span>
            <span className="text-xs text-slate-500">Published</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight capitalize">
            {releaseSlug.replace(/-/g, ' ')}
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Detailed breakdown of features, improvements, and fixes shipped in this release.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-base font-semibold text-white">Highlights</h2>
          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Enhanced system throughput with edge optimization and signature verification.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Zero-downtime database query routing and connection stabilization.</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs border-slate-800">
              <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
              Helpful
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs border-slate-800">
              <Rocket className="h-3.5 w-3.5 mr-1.5 text-violet-400" />
              Excited
            </Button>
          </div>

          <Link href={`/${projectSlug}`}>
            <Button variant="glow" size="sm" className="h-8 text-xs font-semibold">
              View All Updates
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
