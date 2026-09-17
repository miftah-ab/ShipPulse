'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Building2,
  FolderGit2,
  GitBranch,
  RefreshCw,
  Eye,
  Radio,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Code
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  // Form state across 6 steps
  const [formData, setFormData] = useState({
    workspaceName: '',
    workspaceSlug: '',
    projectName: '',
    projectSlug: '',
    repoUrl: '',
    repoBranch: 'main',
    syncStatus: 'idle', // 'idle' | 'syncing' | 'completed'
  })

  // Step 1: Workspace setup
  const handleWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.workspaceName) return
    const slug = formData.workspaceSlug || formData.workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-')
    setFormData((prev) => ({ ...prev, workspaceSlug: slug }))
    setCurrentStep(2)
  }

  // Step 2: Project setup
  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.projectName) return
    const slug = formData.projectSlug || formData.projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')
    setFormData((prev) => ({ ...prev, projectSlug: slug }))
    setCurrentStep(3)
  }

  // Step 3: Connect repository
  const handleRepoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.repoUrl) return
    setCurrentStep(4)
    startSyncSimulation()
  }

  // Step 4: First Git sync & AI generation
  const startSyncSimulation = () => {
    setLoading(true)
    setFormData((prev) => ({ ...prev, syncStatus: 'syncing' }))
    setTimeout(() => {
      setLoading(false)
      setFormData((prev) => ({ ...prev, syncStatus: 'completed' }))
    }, 2000)
  }

  // Copy widget embed snippet
  const widgetSnippet = `<script
  src="${typeof window !== 'undefined' ? window.location.origin : 'https://shippulse.app'}/widget.js"
  data-project="${formData.projectSlug || 'my-project'}"
  defer
></script>`

  const copyWidgetCode = () => {
    navigator.clipboard.writeText(widgetSnippet)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const completeOnboarding = () => {
    router.push(`/${formData.projectSlug || 'demo'}/releases`)
  }

  const steps = [
    { num: 1, title: 'Workspace', icon: Building2 },
    { num: 2, title: 'Project', icon: FolderGit2 },
    { num: 3, title: 'Repository', icon: GitBranch },
    { num: 4, title: 'AI Sync', icon: RefreshCw },
    { num: 5, title: 'Preview', icon: Eye },
    { num: 6, title: 'Widget', icon: Radio },
  ]

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 flex flex-col items-center justify-between p-4 sm:p-8 relative">
      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white">ShipPulse</span>
        </Link>
        <span className="text-xs text-slate-400">Step {currentStep} of 6</span>
      </header>

      {/* Progress Bar / Stepper */}
      <div className="w-full max-w-4xl my-6">
        <div className="grid grid-cols-6 gap-2">
          {steps.map((s) => {
            const Icon = s.icon
            const isDone = currentStep > s.num
            const isCurrent = currentStep === s.num
            return (
              <div key={s.num} className="flex flex-col items-center gap-1.5">
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : isCurrent
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400/40'
                      : 'bg-slate-900 border border-slate-800 text-slate-500'
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={`text-[11px] font-medium hidden sm:inline ${isCurrent ? 'text-indigo-400' : 'text-slate-500'}`}>
                  {s.title}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Container */}
      <main className="w-full max-w-xl my-auto">
        {/* STEP 1: CREATE WORKSPACE */}
        {currentStep === 1 && (
          <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl">Create your Workspace</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                A workspace groups your team, billing plan, and product repositories together.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWorkspaceSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Workspace Name</label>
                  <Input
                    placeholder="e.g. Acme Corp"
                    value={formData.workspaceName}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        workspaceName: e.target.value,
                        workspaceSlug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Workspace URL Slug</label>
                  <div className="flex items-center">
                    <span className="text-xs bg-slate-800 px-3 py-2 rounded-l-lg border border-r-0 border-slate-750 text-slate-400">
                      shippulse.app/
                    </span>
                    <Input
                      className="rounded-l-none"
                      value={formData.workspaceSlug}
                      onChange={(e) => setFormData((p) => ({ ...p, workspaceSlug: e.target.value }))}
                      placeholder="acme-corp"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" variant="glow" className="w-full mt-2 flex items-center justify-center gap-2">
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: CREATE PROJECT */}
        {currentStep === 2 && (
          <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl">Setup your First Product Project</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Each project powers an independent public changelog and in-app widget.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProjectSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Product / Project Name</label>
                  <Input
                    placeholder="e.g. Acme Cloud Dashboard"
                    value={formData.projectName}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        projectName: e.target.value,
                        projectSlug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Public Changelog URL</label>
                  <div className="flex items-center">
                    <span className="text-xs bg-slate-800 px-3 py-2 rounded-l-lg border border-r-0 border-slate-750 text-slate-400">
                      shippulse.app/
                    </span>
                    <Input
                      className="rounded-l-none"
                      value={formData.projectSlug}
                      onChange={(e) => setFormData((p) => ({ ...p, projectSlug: e.target.value }))}
                      placeholder="acme-cloud"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 mt-4">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button type="submit" variant="glow" className="flex items-center gap-2">
                    <span>Continue to Repo</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: CONNECT GITHUB REPOSITORY */}
        {currentStep === 3 && (
          <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl">Connect GitHub Repository</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                ShipPulse reads your merged PRs and commit tags to draft changelogs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRepoSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Repository (owner/name or URL)</label>
                  <Input
                    placeholder="https://github.com/acme/dashboard"
                    value={formData.repoUrl}
                    onChange={(e) => setFormData((p) => ({ ...p, repoUrl: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Release Branch</label>
                  <Input
                    value={formData.repoBranch}
                    onChange={(e) => setFormData((p) => ({ ...p, repoBranch: e.target.value }))}
                    placeholder="main"
                  />
                </div>
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
                  🔒 Granular access: We only inspect metadata (commit titles, PR descriptions). Your source code is never stored or trained on.
                </div>
                <div className="flex items-center justify-between gap-3 mt-4">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button type="submit" variant="glow" className="flex items-center gap-2">
                    <span>Connect & Sync</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: FIRST AI SYNC */}
        {currentStep === 4 && (
          <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl text-center">
            <CardHeader>
              <CardTitle className="text-xl">Running First AI Sync</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Clustering commits, filtering internal chores, and drafting your inaugural release.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.syncStatus === 'syncing' ? (
                <div className="py-8 flex flex-col items-center gap-3">
                  <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin" />
                  <p className="text-sm font-medium text-slate-300">
                    Groq LLM cluster analyzing recent repository activity...
                  </p>
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center gap-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  <div>
                    <h4 className="text-base font-semibold text-white">First Release Draft Ready!</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Synthesized 14 commits into 3 customer-facing product enhancements.
                    </p>
                  </div>
                  <Button variant="glow" onClick={() => setCurrentStep(5)} className="mt-4 flex items-center gap-2">
                    <span>Preview Release</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 5: PREVIEW INITIAL RELEASE */}
        {currentStep === 5 && (
          <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Initial Release Preview</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    This is how your updates will appear to your end users.
                  </CardDescription>
                </div>
                <Badge variant="feature">Generated</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white">v1.0.0  -  Launch of {formData.projectName || 'New Service'}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We are excited to unveil our core platform features, enhanced performance optimizations, and full API integration.
                </p>
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-300">
                      <strong>Core Engine:</strong> High throughput processing pipeline with sub-second response times.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-300">
                      <strong>Modern API:</strong> Comprehensive endpoints with developer-friendly documentation.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 mt-4">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(4)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button variant="glow" onClick={() => setCurrentStep(6)} className="flex items-center gap-2">
                  <span>Next: In-App Widget</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 6: IN-APP WIDGET SETUP */}
        {currentStep === 6 && (
          <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl">Embed In-App Widget</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Copy and paste this snippet right before the closing &lt;/body&gt; tag of your website.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto">
                  {widgetSnippet}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyWidgetCode}
                  className="absolute top-3 right-3 h-7 px-2.5 text-xs bg-slate-850 hover:bg-slate-800 text-slate-200"
                >
                  {copiedCode ? (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Check className="h-3 w-3" /> Copied
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy className="h-3 w-3" /> Copy
                    </span>
                  )}
                </Button>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Widget Features Included:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Automatic unread badge count tracking</li>
                  <li>Shadow DOM isolation (never clashes with your CSS)</li>
                  <li>No external framework dependencies (~12KB gzipped)</li>
                </ul>
              </div>

              <div className="pt-2">
                <Button
                  onClick={completeOnboarding}
                  variant="glow"
                  className="w-full flex items-center justify-center gap-2 h-11 text-base font-semibold"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer link */}
      <footer className="w-full max-w-4xl text-center py-4 text-xs text-slate-500">
        Need help? Check out our{' '}
        <Link href="/docs" className="text-indigo-400 hover:underline">
          documentation
        </Link>{' '}
        or join our community Discord.
      </footer>
    </div>
  )
}
