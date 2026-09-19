'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  GitBranch,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Share2,
  Mail,
  Webhook,
  Plus,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function IntegrationsPage() {
  const params = useParams()
  const projectSlug = params?.projectSlug as string

  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [connectedRepo, setConnectedRepo] = useState<string>('')
  const [connectedBranch, setConnectedBranch] = useState<string>('main')
  const [lastSync, setLastSync] = useState<string>('Never')
  const [showPickerModal, setShowPickerModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [repos, setRepos] = useState<any[]>([])
  const [reposLoading, setReposLoading] = useState(false)
  const [reposError, setReposError] = useState<string | null>(null)
  const [integrationLoading, setIntegrationLoading] = useState(true)

  // Load current integration config from the project
  useEffect(() => {
    async function loadIntegration() {
      try {
        setIntegrationLoading(true)
        const res = await fetch(`/api/dashboard/integration?projectSlug=${encodeURIComponent(projectSlug)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.repo) {
            setConnectedRepo(data.repo.repoUrl || '')
            setConnectedBranch(data.repo.defaultBranch || 'main')
            setLastSync(data.repo.lastSync || 'Never')
          }
        }
      } catch {
        // silent
      } finally {
        setIntegrationLoading(false)
      }
    }
    if (projectSlug) loadIntegration()
  }, [projectSlug])

  // Load repos when picker opens
  useEffect(() => {
    if (!showPickerModal) return
    async function loadRepos() {
      try {
        setReposLoading(true)
        setReposError(null)
        const res = await fetch(searchQuery
          ? `/api/github/repos?q=${encodeURIComponent(searchQuery)}`
          : '/api/github/repos'
        )
        const data = await res.json()
        if (res.ok) {
          setRepos(data.repositories || [])
          if (data.message) setReposError(data.message)
        } else {
          setRepos([])
          setReposError(data.error || 'Failed to load repositories')
        }
      } catch {
        setReposError('Failed to load repositories. Check your GitHub connection.')
      } finally {
        setReposLoading(false)
      }
    }
    loadRepos()
  }, [showPickerModal, searchQuery])

  const triggerManualSync = async () => {
    setIsSyncing(true)
    setSyncMessage(null)
    setSyncError(null)
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectSlug }),
      })
      const data = await res.json()
      if (res.ok) {
        setSyncMessage(data.message || 'Sync completed successfully.')
        setLastSync('Just now')
      } else {
        setSyncError(data.error || 'Sync failed. Please try again.')
      }
    } catch {
      setSyncError('Network error during sync. Please try again.')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleImportRepo = async (repo: any) => {
    try {
      const res = await fetch('/api/dashboard/integration', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug,
          repoUrl: repo.url,
          defaultBranch: repo.defaultBranch || 'main',
          repoFullName: repo.fullName,
        }),
      })
      if (res.ok) {
        setConnectedRepo(repo.fullName)
        setConnectedBranch(repo.defaultBranch || 'main')
        setLastSync('Never')
        setShowPickerModal(false)
        setSyncMessage(`Repository switched to ${repo.fullName}`)
        setTimeout(() => setSyncMessage(null), 3000)
      }
    } catch {
      setSyncError('Failed to switch repository. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Git & Integrations</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure connected GitHub repositories, automated webhooks, and third-party broadcast channels.
        </p>
      </div>

      {/* GitHub Repo Card */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-indigo-400" />
              <CardTitle className="text-base">Connected Repository</CardTitle>
              {connectedRepo && (
                <Badge variant="feature" className="text-[10px]">Active Webhook</Badge>
              )}
            </div>
            <CardDescription className="text-xs text-slate-400 mt-1">
              {connectedRepo
                ? 'Synchronizing with GitHub repository events automatically.'
                : 'No repository connected. Import one to start generating changelogs.'}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPickerModal(true)}
              className="text-xs h-8 border-slate-750"
            >
              {connectedRepo ? 'Change Repository' : 'Import Repository'}
            </Button>
            {connectedRepo && (
              <Button
                size="sm"
                variant="secondary"
                onClick={triggerManualSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 h-8 text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {syncMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{syncMessage}</span>
            </div>
          )}
          {syncError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{syncError}</span>
            </div>
          )}

          {integrationLoading ? (
            <div className="flex items-center gap-2 py-4 text-slate-500 text-xs">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading integration...
            </div>
          ) : connectedRepo ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <p className="text-slate-500 text-[11px]">Repository</p>
                <p className="text-white font-mono font-semibold mt-0.5">{connectedRepo}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <p className="text-slate-500 text-[11px]">Watched Branch</p>
                <p className="text-white font-mono font-semibold mt-0.5">{connectedBranch}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <p className="text-slate-500 text-[11px]">Last Sync</p>
                <p className="text-white font-semibold mt-0.5">{lastSync}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-800 rounded-xl">
              <GitBranch className="h-8 w-8 text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-300">No repository connected</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Import a GitHub repository to start auto-generating changelogs from your commits and PRs.
              </p>
              <Button size="sm" variant="glow" className="mt-4 text-xs" onClick={() => setShowPickerModal(true)}>
                Import Repository
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Repository Picker Modal */}
      {showPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <Card className="w-full max-w-lg border-slate-800 bg-slate-900 shadow-2xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Import GitHub Repository</CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-0.5">
                  Select a repository to synchronize changelogs automatically.
                </CardDescription>
              </div>
              <button onClick={() => setShowPickerModal(false)} className="text-slate-500 hover:text-white p-1">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs"
              />

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {reposLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-slate-500 text-xs">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading repositories...
                  </div>
                ) : reposError ? (
                  <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400 text-xs text-center">
                    {reposError}
                  </div>
                ) : repos.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs">
                    No repositories found. Connect your GitHub account to import.
                  </div>
                ) : (
                  repos.map((repo) => (
                    <div
                      key={repo.id}
                      className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 flex items-center justify-between gap-2"
                    >
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white truncate">{repo.fullName}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                            repo.isPrivate ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {repo.isPrivate ? 'Private' : 'Public'}
                          </span>
                        </div>
                        {repo.description && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{repo.description}</p>
                        )}
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{repo.defaultBranch}</p>
                      </div>

                      <Button
                        size="sm"
                        variant={connectedRepo === repo.fullName ? 'secondary' : 'glow'}
                        onClick={() => handleImportRepo(repo)}
                        className="h-7 text-xs shrink-0"
                      >
                        {connectedRepo === repo.fullName ? 'Active' : 'Import'}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Broadcast Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white">Slack Relay</h3>
              <Badge variant="outline" className="text-[10px]">Not connected</Badge>
            </div>
            <p className="text-xs text-slate-400">
              Post release announcements directly into a Slack channel.
            </p>
            <Button variant="outline" size="sm" className="w-full text-xs h-8 border-slate-750">
              Connect Slack
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white">Discord Relay</h3>
              <Badge variant="outline" className="text-[10px]">Not connected</Badge>
            </div>
            <p className="text-xs text-slate-400">
              Announce new features to your community Discord server.
            </p>
            <Button variant="secondary" size="sm" className="w-full text-xs h-8">
              Connect Discord
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white">Custom Webhook</h3>
              <Badge variant="outline" className="text-[10px]">Not configured</Badge>
            </div>
            <p className="text-xs text-slate-400">
              Trigger downstream systems with HMAC-signed JSON payloads on release publish.
            </p>
            <Button variant="outline" size="sm" className="w-full text-xs h-8 border-slate-750">
              Configure Webhook
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
