'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  GitBranch,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Share2,
  Mail,
  Webhook,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function IntegrationsPage() {
  const params = useParams()
  const projectSlug = (params?.projectSlug as string) || 'demo'
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [connectedRepo, setConnectedRepo] = useState('acme/dashboard')
  const [connectedBranch, setConnectedBranch] = useState('main')
  const [showPickerModal, setShowPickerModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [repos, setRepos] = useState<any[]>([])

  React.useEffect(() => {
    fetch('/api/github/repos')
      .then((res) => res.json())
      .then((d) => setRepos(d.repositories || []))
      .catch(() => {})
  }, [])

  const triggerManualSync = () => {
    setIsSyncing(true)
    setSyncMessage(null)
    setTimeout(() => {
      setIsSyncing(false)
      setSyncMessage('Repository synced successfully: Ingested 3 new commits!')
      setTimeout(() => setSyncMessage(null), 3000)
    }, 2000)
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
              <Badge variant="feature" className="text-[10px]">Active Webhook</Badge>
            </div>
            <CardDescription className="text-xs text-slate-400 mt-1">
              Synchronizing with GitHub repository events automatically.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPickerModal(true)}
              className="text-xs h-8 border-slate-750"
            >
              Change Repository
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={triggerManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 h-8 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{isSyncing ? 'Ingesting commits...' : 'Sync Now'}</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {syncMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{syncMessage}</span>
            </div>
          )}

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
              <p className="text-white font-semibold mt-0.5">Just now</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repository Picker Modal */}
      {showPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <Card className="w-full max-w-lg border-slate-800 bg-slate-900 shadow-2xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Import / Switch Git Repository</CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-0.5">
                  Select a connected repository to synchronize changelogs.
                </CardDescription>
              </div>
              <button onClick={() => setShowPickerModal(false)} className="text-slate-500 hover:text-white">✕</button>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs"
              />

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {repos
                  .filter((r) => !searchQuery || r.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((repo) => (
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
                        <p className="text-[11px] text-slate-400 truncate">{repo.description}</p>
                      </div>

                      <Button
                        size="sm"
                        variant={connectedRepo === repo.fullName ? 'secondary' : 'glow'}
                        onClick={() => {
                          setConnectedRepo(repo.fullName)
                          setConnectedBranch(repo.defaultBranch || 'main')
                          setShowPickerModal(false)
                          setSyncMessage(`Connected repository switched to ${repo.fullName}!`)
                          setTimeout(() => setSyncMessage(null), 3000)
                        }}
                        className="h-7 text-xs shrink-0"
                      >
                        {connectedRepo === repo.fullName ? 'Active' : 'Import'}
                      </Button>
                    </div>
                  ))}
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
              <Badge variant="outline" className="text-[10px]">Configured</Badge>
            </div>
            <p className="text-xs text-slate-400">
              Post release announcements directly into #product-announcements.
            </p>
            <Button variant="outline" size="sm" className="w-full text-xs h-8 border-slate-750">
              Edit Webhook URL
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white">Discord Relay</h3>
              <Badge variant="outline" className="text-[10px]">Disconnected</Badge>
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
              <Badge variant="feature" className="text-[10px]">Active</Badge>
            </div>
            <p className="text-xs text-slate-400">
              Trigger downstream systems with HMAC-signed JSON payloads on release publish.
            </p>
            <Button variant="outline" size="sm" className="w-full text-xs h-8 border-slate-750">
              Manage Endpoints
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
