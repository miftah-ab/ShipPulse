'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Sparkles,
  ArrowLeft,
  Save,
  Send,
  Eye,
  GitBranch,
  Wand2,
  CheckCircle2,
  Layers,
  FileText,
  Mail,
  Radio,
  Tag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default function NewReleasePage() {
  const params = useParams()
  const router = useRouter()
  const projectSlug = params?.projectSlug as string

  const [version, setVersion] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [savedStatus, setSavedStatus] = useState<string | null>(null)

  const categories = [
    { id: 'feature', label: 'Feature', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { id: 'fix', label: 'Fix', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { id: 'perf', label: 'Performance', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
    { id: 'breaking', label: 'Breaking', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    { id: 'security', label: 'Security', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  ]

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  // AI Tone adjustment actions — calls the real Groq-powered API
  const applyAiTone = async (tone: string) => {
    if (!content.trim()) return
    setIsAiProcessing(true)
    try {
      const res = await fetch('/api/ai/tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, tone, version }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.content) setContent(data.content)
      }
    } catch (e) {
      console.error('AI tone failed:', e)
    } finally {
      setIsAiProcessing(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      setSavedStatus('Saving...')
      const res = await fetch('/api/dashboard/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug,
          title,
          version,
          content,
          status: 'draft',
          tags: selectedCategories,
        }),
      })
      if (!res.ok) throw new Error('Failed to save draft')
      setSavedStatus('Draft saved!')
      setTimeout(() => setSavedStatus(null), 2500)
    } catch (err: any) {
      setSavedStatus('Error saving draft')
      setTimeout(() => setSavedStatus(null), 3000)
    }
  }

  const handlePublish = async () => {
    try {
      setSavedStatus('Publishing...')
      const res = await fetch('/api/dashboard/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug,
          title,
          version,
          content,
          status: 'published',
          tags: selectedCategories,
        }),
      })
      if (!res.ok) throw new Error('Failed to publish')
      setSavedStatus('Published to changelog & widget!')
      setTimeout(() => {
        router.push(`/${projectSlug}/releases`)
      }, 1000)
    } catch (err: any) {
      setSavedStatus('Error publishing release')
      setTimeout(() => setSavedStatus(null), 3000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link href={`/${projectSlug}/releases`}>
            <Button variant="outline" size="sm" className="h-8 text-xs border-slate-800 hover:bg-slate-800">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Releases
            </Button>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-xs font-semibold text-slate-300">Draft Release</span>
        </div>

        <div className="flex items-center gap-2">
          {savedStatus && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 mr-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {savedStatus}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="h-8 text-xs border-slate-750"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
            {previewMode ? 'Edit Mode' : 'Preview'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveDraft}
            className="h-8 text-xs"
          >
            <Save className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
            Save Draft
          </Button>

          <Button
            variant="glow"
            size="sm"
            onClick={handlePublish}
            className="h-8 text-xs font-semibold"
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Publish Release
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Main Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Version Tag</label>
              <Input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. v2.5.0"
                className="font-mono text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-400 block mb-1">Release Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Payment Processor Upgrade & Performance Boost"
                className="text-xs"
              />
            </div>
          </div>

          {/* Categories Selector */}
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Categories & Tags</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1 rounded-full border text-xs font-medium transition-all ${
                      isSelected
                        ? cat.color
                        : 'border-slate-800 text-slate-500 bg-slate-900/50 hover:border-slate-700'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content Area / Markdown */}
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Release Notes (Markdown)</label>
            {previewMode ? (
              <div className="min-h-[360px] p-6 rounded-xl bg-slate-950 border border-slate-800 prose prose-invert prose-sm max-w-none">
                <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
                <div className="whitespace-pre-wrap text-slate-300 text-xs leading-relaxed">
                  {content}
                </div>
              </div>
            ) : (
              <textarea
                rows={16}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-750 bg-slate-900/90 text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Write markdown release notes or use the AI Assist tools on the right..."
              />
            )}
          </div>
        </div>

        {/* AI & Git Sources Sidebar */}
        <div className="space-y-4">
          {/* AI Assist Box */}
          <Card className="border-indigo-500/30 bg-slate-900/80 backdrop-blur-xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">AI Copilot Actions</h4>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] text-slate-400">One-click rewrite with specified tone:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isAiProcessing}
                    onClick={() => applyAiTone('executive')}
                    className="text-xs h-8 border-slate-750 hover:bg-slate-800"
                  >
                    Executive Brief
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isAiProcessing}
                    onClick={() => applyAiTone('bulleted')}
                    className="text-xs h-8 border-slate-750 hover:bg-slate-800"
                  >
                    Bulleted Highlights
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isAiProcessing}
                  onClick={() => applyAiTone('widget')}
                  className="w-full text-xs h-8 border-slate-750 hover:bg-slate-800 flex items-center justify-center gap-1.5"
                >
                  <Radio className="h-3 w-3 text-indigo-400" />
                  <span>Condense for Widget Drawer</span>
                </Button>
              </div>

              {isAiProcessing && (
                <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-center text-xs text-indigo-300 animate-pulse">
                  Applying Groq AI tone transformation...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Sources Box */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-slate-400" />
                <h4 className="text-xs font-bold text-slate-200">Linked Commits & PRs</h4>
              </div>
              <p className="text-[11px] text-slate-500">
                Commits and PRs will be automatically linked when a GitHub repository is connected via the Integrations page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
