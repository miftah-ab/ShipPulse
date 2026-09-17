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
              <p className="text-white font-mono font-semibold mt-0.5">acme/dashboard</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <p className="text-slate-500 text-[11px]">Watched Branch</p>
              <p className="text-white font-mono font-semibold mt-0.5">main</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <p className="text-slate-500 text-[11px]">Last Sync</p>
              <p className="text-white font-semibold mt-0.5">Just now</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
