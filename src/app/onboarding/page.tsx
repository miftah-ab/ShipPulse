'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  FolderGit2,
  GitBranch,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Code,
  Search,
  Plus,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false)
  const [checkingExisting, setCheckingExisting] = useState(true)
  const [activeMode, setActiveMode] = useState<'import' | 'manual'>('import')

  // Repositories state
  const [repos, setRepos] = useState<any[]>([])
  const [repoSearch, setRepoSearch] = useState('')
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [needsGitHubConnect, setNeedsGitHubConnect] = useState(false)
  const [repoMessage, setRepoMessage] = useState('')

  // Selected or manual project state
  const [projectName, setProjectName] = useState('')
  const [projectSlug, setProjectSlug] = useState('')
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null)
  const [directRepoUrl, setDirectRepoUrl] = useState('')

  // Status & Progress
  const [provisionPhase, setProvisionPhase] = useState<string | null>(null)
  const [provisionError, setProvisionError] = useState<string | null>(null)

  const fetchRepos = useCallback(async (query?: string) => {
    try {
      setLoadingRepos(true)
      setNeedsGitHubConnect(false)
      const url = query ? `/api/github/repos?q=${encodeURIComponent(query)}` : '/api/github/repos'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        if (data.needsConnect) {
          setNeedsGitHubConnect(true)
          setRepoMessage(data.message || 'Connect your GitHub account to import repositories.')
          setRepos([])
        } else {
          setRepos(data.repositories || [])
          setRepoMessage('')
        }
      }
    } catch {
      // Keep defaults
    } finally {
      setLoadingRepos(false)
    }
  }, [])

  useEffect(() => {
    const checkExistingUser = async () => {
      try {
        const res = await fetch('/api/projects')
        if (res.ok) {
          const d = await res.json()
          if (d?.projects && d.projects.length > 0) {
            window.location.replace(`/${d.projects[0].slug}/releases`)
            return
          }
        }
      } catch {
        // continue
      } finally {
        setCheckingExisting(false)
      }
    }
    checkExistingUser()
    fetchRepos()
  }, [fetchRepos])

  // Execute fast, reliable 1-click provision
  const handleImportRepo = async (repo: any) => {
    try {
      setLoading(true)
      setSelectedRepo(repo)
      setProvisionError(null)
      setProvisionPhase(`Connecting ${repo.fullName} and setting up project…`)

      const pName = repo.name || repo.fullName.split('/')[1] || 'Product'
      const pSlug = pName.toLowerCase().replace(/[^a-z0-9]+/g, '-')

      // 1. Provision Workspace & Project immediately
      const res = await fetch('/api/onboarding/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceName: `${repo.owner || 'My'} Workspace`,
          projectName: pName,
          projectSlug: pSlug,
          repoUrl: repo.url,
          repoBranch: repo.defaultBranch || 'main',
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.project?.slug) {
        throw new Error(data.error || 'Failed to create project')
      }

      setProvisionPhase('Import complete! Redirecting to your dashboard…')
      setTimeout(() => {
        window.location.href = `/${data.project.slug}/releases`
      }, 600)
    } catch (err: any) {
      console.error('[Onboarding] Import failed:', err)
      setProvisionError(err.message || 'Failed to import repository. Please try again.')
      setLoading(false)
      setProvisionPhase(null)
    }
  }

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim()) return

    try {
      setLoading(true)
      setProvisionError(null)
      setProvisionPhase('Creating your project…')

      const slug = projectSlug.trim() || projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')

      const res = await fetch('/api/onboarding/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: projectName.trim(),
          projectSlug: slug,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.project?.slug) {
        throw new Error(data.error || 'Failed to create project')
      }

      setProvisionPhase('Ready! Launching dashboard…')
      setTimeout(() => {
        window.location.href = `/${data.project.slug}/releases`
      }, 500)
    } catch (err: any) {
      console.error('[Onboarding] Manual creation failed:', err)
      setProvisionError(err.message || 'Failed to create project.')
      setLoading(false)
      setProvisionPhase(null)
    }
  }

  if (checkingExisting) {
    return (
      <div className="min-h-screen bg-[#0A0D14] flex flex-col items-center justify-center p-6 text-slate-400">
        <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mb-4" />
        <p className="text-sm font-medium">Checking workspace status…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 flex flex-col items-center justify-between p-4 sm:p-8 relative">
      {/* Top Header */}
      <header className="w-full max-w-4xl flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white">ShipPulse</span>
        </Link>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Release Notes & Product Updates</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-2xl my-auto py-6">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-1">
            <Zap className="h-3.5 w-3.5" />
            <span>Instant Project Setup</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Connect your code. Ship updates that users understand.
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Select a GitHub repository to automatically monitor commits and draft customer releases, or create a project from scratch.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={() => setActiveMode('import')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeMode === 'import'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span>Import GitHub Repository</span>
          </button>
          <button
            onClick={() => setActiveMode('manual')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeMode === 'manual'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Custom Project</span>
          </button>
        </div>

        {/* Active Progress or Error Banner */}
        {provisionPhase && (
          <div className="mb-6 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-center gap-3 text-indigo-200 text-xs">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
            <span>{provisionPhase}</span>
          </div>
        )}
        {provisionError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
            <span>{provisionError}</span>
            <button onClick={() => setProvisionError(null)} className="underline hover:text-rose-300 ml-3">
              Dismiss
            </button>
          </div>
        )}

        {/* MODE 1: GITHUB IMPORT */}
        {activeMode === 'import' && (
          <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Your GitHub Repositories</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Click &quot;Import&quot; to link your repository and launch your changelog.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="border-slate-750 text-[11px] font-mono flex items-center gap-1">
                  <GitBranch className="h-3 w-3 text-indigo-400" />
                  <span>GitHub Connected</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    placeholder="Search your repositories..."
                    className="h-9 w-full rounded-lg border border-slate-750 bg-slate-950 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchRepos(repoSearch || undefined)}
                  className="h-9 px-3 rounded-lg border border-slate-750 bg-slate-950 hover:bg-slate-900 text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                  title="Refresh repository list"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingRepos ? 'animate-spin text-indigo-400' : ''}`} />
                </button>
              </div>

              {/* Repositories List */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {needsGitHubConnect && !loadingRepos && (
                  <div className="p-6 text-center border border-dashed border-indigo-800/60 rounded-xl space-y-3 bg-indigo-950/20">
                    <GitBranch className="h-8 w-8 text-indigo-400 mx-auto" />
                    <p className="text-xs text-slate-300 font-medium">{repoMessage}</p>
                    <a
                      href="/api/github/connect?next=/onboarding"
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      <GitBranch className="h-3.5 w-3.5" />
                      Connect GitHub Account
                    </a>
                  </div>
                )}

                {repos.map((repo) => {
                  const isImportingThis = loading && selectedRepo?.id === repo.id
                  return (
                    <div
                      key={repo.id}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950 flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white truncate">{repo.fullName}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                              repo.isPrivate
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {repo.isPrivate ? 'Private' : 'Public'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{repo.defaultBranch}</span>
                        </div>
                        {repo.description && (
                          <p className="text-[11px] text-slate-400 truncate">{repo.description}</p>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant="glow"
                        disabled={loading}
                        onClick={() => handleImportRepo(repo)}
                        className="h-8 text-xs shrink-0 px-3.5 font-semibold flex items-center gap-1.5"
                      >
                        {isImportingThis ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Importing…</span>
                          </>
                        ) : (
                          <>
                            <span>Import</span>
                            <ArrowRight className="h-3 w-3" />
                          </>
                        )}
                      </Button>
                    </div>
                  )
                })}

                {repos.length === 0 && !loadingRepos && !needsGitHubConnect && (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500 space-y-2">
                    <p>{repoSearch ? `No repositories matching "${repoSearch}".` : 'No repositories found on this GitHub account.'}</p>
                    <button
                      onClick={() => setActiveMode('manual')}
                      className="text-indigo-400 hover:underline inline-block mt-1 font-semibold"
                    >
                      Or create a project without GitHub &rarr;
                    </button>
                  </div>
                )}
              </div>

              {/* Direct GitHub URL import */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Or enter any GitHub repo URL (https://github.com/owner/repo)..."
                  value={directRepoUrl}
                  onChange={(e) => setDirectRepoUrl(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!directRepoUrl.trim() || loading}
                  onClick={() => {
                    const cleanUrl = directRepoUrl.trim()
                    const repoName = cleanUrl.replace(/https?:\/\/github\.com\//, '').replace(/\.git$/, '')
                    const shortName = repoName.split('/')[1] || repoName
                    handleImportRepo({
                      id: Date.now(),
                      name: shortName,
                      fullName: repoName,
                      owner: repoName.split('/')[0] || 'User',
                      url: cleanUrl,
                      defaultBranch: 'main',
                      isPrivate: false,
                    })
                  }}
                  className="h-9 text-xs px-3.5 shrink-0 border-slate-750 hover:bg-slate-850"
                >
                  Import URL
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* MODE 2: CUSTOM PROJECT */}
        {activeMode === 'manual' && (
          <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg">Create Custom Product Project</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                You can link a GitHub repository or custom webhook anytime later from Project Settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Project / Product Name</label>
                  <Input
                    placeholder="e.g. Acme Web App"
                    value={projectName}
                    onChange={(e) => {
                      setProjectName(e.target.value)
                      setProjectSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
                    }}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Public Changelog URL Slug</label>
                  <div className="flex items-center">
                    <span className="text-xs bg-slate-800 px-3 py-2 rounded-l-lg border border-r-0 border-slate-750 text-slate-400">
                      shippulse.app/
                    </span>
                    <Input
                      className="rounded-l-none"
                      value={projectSlug}
                      onChange={(e) => setProjectSlug(e.target.value)}
                      placeholder="acme-web-app"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="glow"
                  disabled={loading || !projectName.trim()}
                  className="w-full h-10 mt-3 flex items-center justify-center gap-2 font-semibold text-xs"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Creating Project…</span>
                    </>
                  ) : (
                    <>
                      <span>Launch Project & Enter Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl text-center py-4 text-xs text-slate-500">
        ShipPulse &bull; The AI communication layer between what you ship and what users care about.
      </footer>
    </div>
  )
}
