'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Settings,
  Globe,
  Radio,
  Key,
  CheckCircle2,
  Plus,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function SettingsPage() {
  const params = useParams()
  const projectSlug = params?.projectSlug as string

  const [activeTab, setActiveTab] = useState<'general' | 'domain' | 'widget' | 'api'>('general')
  const [projectName, setProjectName] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [domainVerified, setDomainVerified] = useState(false)
  const [accentColor, setAccentColor] = useState('#635BFF')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; maskedKey: string; scopes: string[] }>>([])
  const [keysLoading, setKeysLoading] = useState(false)

  // Load project settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`/api/projects?slug=${encodeURIComponent(projectSlug)}`)
        if (res.ok) {
          const data = await res.json()
          const project = data.projects?.find((p: any) => p.slug === projectSlug)
          if (project) {
            setProjectName(project.name || projectSlug)
            setCustomDomain(project.custom_domain || '')
            setAccentColor(project.accent_color || '#635BFF')
          }
        }
      } catch {
        setProjectName(projectSlug)
      }
    }
    if (projectSlug) loadSettings()
  }, [projectSlug])

  // Load API keys
  useEffect(() => {
    if (activeTab !== 'api') return
    async function loadKeys() {
      try {
        setKeysLoading(true)
        const res = await fetch(`/api/dashboard/api-keys?projectSlug=${encodeURIComponent(projectSlug)}`)
        if (res.ok) {
          const data = await res.json()
          setApiKeys(data.keys || [])
        }
      } catch {
        setApiKeys([])
      } finally {
        setKeysLoading(false)
      }
    }
    loadKeys()
  }, [activeTab, projectSlug])

  const handleSaveGeneral = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/dashboard/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectSlug, name: projectName }),
      })
      if (res.ok) {
        setSavedMsg('Settings saved!')
        setTimeout(() => setSavedMsg(null), 2500)
      }
    } catch {
      setSavedMsg('Error saving settings')
      setTimeout(() => setSavedMsg(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleVerifyDomain = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/dashboard/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectSlug, customDomain }),
      })
      if (res.ok) {
        setDomainVerified(true)
      }
    } catch {
      setSavedMsg('Failed to save domain')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveWidget = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/dashboard/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectSlug, accentColor }),
      })
      if (res.ok) {
        setSavedMsg('Widget settings saved!')
        setTimeout(() => setSavedMsg(null), 2500)
      }
    } catch {
      setSavedMsg('Error saving widget settings')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateKey = async () => {
    try {
      const res = await fetch('/api/dashboard/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectSlug, name: 'API Key', scopes: ['releases:read', 'releases:write'] }),
      })
      if (res.ok) {
        const data = await res.json()
        setApiKeys((prev) => [...prev, data.key])
      }
    } catch {
      console.error('Failed to create API key')
    }
  }

  const handleDeleteKey = async (id: string) => {
    try {
      await fetch(`/api/dashboard/api-keys?id=${id}`, { method: 'DELETE' })
      setApiKeys((prev) => prev.filter((k) => k.id !== id))
    } catch {
      console.error('Failed to delete key')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Project Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure project metadata, custom domains, in-app widget appearance, and API access keys.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
        {[
          { id: 'general', label: 'General' },
          { id: 'domain', label: 'Custom Domain' },
          { id: 'widget', label: 'In-App Widget' },
          { id: 'api', label: 'API Keys' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === t.id
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {savedMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 max-w-2xl">
          <CheckCircle2 className="h-4 w-4" />
          {savedMsg}
        </div>
      )}

      {/* GENERAL */}
      {activeTab === 'general' && (
        <Card className="border-slate-800 bg-slate-900/50 max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">General Information</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Basic identification and branding for this product.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Project Name</label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="text-xs bg-slate-950"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Changelog URL Slug</label>
              <Input value={projectSlug} readOnly className="text-xs bg-slate-950 font-mono text-slate-400 cursor-not-allowed" />
              <p className="text-[11px] text-slate-500">The URL slug cannot be changed after project creation.</p>
            </div>
            <Button variant="glow" size="sm" className="text-xs mt-2" onClick={handleSaveGeneral} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* CUSTOM DOMAIN */}
      {activeTab === 'domain' && (
        <Card className="border-slate-800 bg-slate-900/50 max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">Custom Domain Setup</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Map your own subdomain to host your public changelog with free automated SSL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Your Subdomain</label>
              <div className="flex gap-2">
                <Input
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="updates.yourdomain.com"
                  className="text-xs bg-slate-950"
                />
                <Button size="sm" variant="secondary" onClick={handleVerifyDomain} disabled={saving} className="text-xs shrink-0">
                  {saving ? 'Saving...' : 'Save & Verify'}
                </Button>
              </div>
            </div>

            {domainVerified ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Domain saved! Add the CNAME record below to complete setup.</span>
              </div>
            ) : null}

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <p className="font-semibold text-slate-300">DNS Configuration:</p>
              <div className="font-mono text-[11px] text-slate-400 space-y-1">
                <p>Type: <span className="text-white">CNAME</span></p>
                <p>Name: <span className="text-white">updates</span></p>
                <p>Target: <span className="text-indigo-400">cname.shippulse.app</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* WIDGET */}
      {activeTab === 'widget' && (
        <Card className="border-slate-800 bg-slate-900/50 max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">Widget Styling & Behavior</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Customize the look and feel of the embeddable in-app drawer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Brand Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-9 w-12 rounded cursor-pointer bg-slate-900 border border-slate-800 p-0.5"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="font-mono text-xs w-32 bg-slate-950"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Default Display Mode</label>
              <select className="w-full h-9 rounded-lg border border-slate-750 bg-slate-950 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                <option value="floating">Floating Action Button (Bottom Right)</option>
                <option value="modal">Centered Modal Dialog</option>
                <option value="slideout">Slide-over Right Drawer</option>
              </select>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <p className="text-slate-400 mb-2">Embed code for your app:</p>
              <pre className="font-mono text-indigo-300 text-[11px] whitespace-pre-wrap">{`<script
  src="https://shippulse.app/widget.js"
  data-project="${projectSlug}"
  defer
></script>`}</pre>
            </div>

            <Button variant="glow" size="sm" className="text-xs" onClick={handleSaveWidget} disabled={saving}>
              {saving ? 'Saving...' : 'Save Widget Configuration'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API KEYS */}
      {activeTab === 'api' && (
        <Card className="border-slate-800 bg-slate-900/50 max-w-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">REST API Keys</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Keys authenticate programmatic requests to ShipPulse API v1.
              </CardDescription>
            </div>
            <Button size="sm" variant="glow" className="text-xs" onClick={handleCreateKey}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create Key
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {keysLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-slate-500 text-xs">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading API keys...
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                No API keys yet. Create one to start using the ShipPulse REST API.
              </div>
            ) : (
              apiKeys.map((key) => (
                <div key={key.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white">{key.name}</p>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">{key.maskedKey}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {key.scopes.map((s) => (
                      <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                    ))}
                    <button onClick={() => handleDeleteKey(key.id)} className="text-slate-500 hover:text-rose-400 p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
