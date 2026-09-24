'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  Settings,
  Globe,
  Radio,
  Key,
  CheckCircle2,
  Plus,
  Trash2,
  RefreshCw,
  CreditCard,
  Zap,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function SettingsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectSlug = params?.projectSlug as string

  const initialTab = (searchParams.get('tab') as any) || 'general'
  const [activeTab, setActiveTab] = useState<'general' | 'domain' | 'widget' | 'api' | 'billing'>(initialTab)

  const [projectName, setProjectName] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [domainVerified, setDomainVerified] = useState(false)
  const [accentColor, setAccentColor] = useState('#635BFF')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; maskedKey: string; scopes: string[] }>>([])
  const [keysLoading, setKeysLoading] = useState(false)

  // Billing state
  const [billingData, setBillingData] = useState<any | null>(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [payingPlan, setPayingPlan] = useState<'pro' | 'team' | null>(null)
  const [payingProvider, setPayingProvider] = useState<'polar' | 'chapa' | null>(null)

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

  // Handle return from payment provider
  useEffect(() => {
    const status = searchParams.get('status')
    const provider = searchParams.get('provider')
    const txRef = searchParams.get('tx_ref')

    if (status === 'success') {
      if (provider === 'chapa' && txRef) {
        // Verify with backend
        fetch(`/api/billing/chapa/verify?tx_ref=${encodeURIComponent(txRef)}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.success) {
              setSavedMsg(`Payment confirmed! Your workspace is now upgraded to ${d.plan?.toUpperCase()}.`)
              loadBilling()
            }
          })
          .catch(() => {})
      } else {
        setSavedMsg('Subscription confirmed! Your workspace limits have been updated.')
        loadBilling()
      }
    }
  }, [searchParams])

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

  // Load Billing details
  const loadBilling = async () => {
    try {
      setBillingLoading(true)
      const res = await fetch(`/api/billing/plans?projectSlug=${encodeURIComponent(projectSlug)}`)
      if (res.ok) {
        const data = await res.json()
        setBillingData(data)
      }
    } catch (e) {
      console.error('Failed to load billing details:', e)
    } finally {
      setBillingLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'billing') {
      loadBilling()
    }
  }, [activeTab, projectSlug])

  const handleSaveGeneral = async () => {
    try {
      setSaving(true)
      setErrorMsg(null)
      const res = await fetch(`/api/dashboard/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectSlug, name: projectName }),
      })
      if (res.ok) {
        setSavedMsg('Settings saved!')
        setTimeout(() => setSavedMsg(null), 2500)
      } else {
        const d = await res.json()
        setErrorMsg(d.error || 'Failed to save settings')
      }
    } catch {
      setErrorMsg('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const handleVerifyDomain = async () => {
    try {
      setSaving(true)
      setErrorMsg(null)
      const res = await fetch(`/api/dashboard/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectSlug, customDomain }),
      })
      const data = await res.json()
      if (res.ok) {
        setDomainVerified(true)
        setSavedMsg('Custom domain configured!')
        setTimeout(() => setSavedMsg(null), 3000)
      } else {
        setErrorMsg(data.error || 'Failed to save custom domain')
      }
    } catch {
      setErrorMsg('Failed to save domain')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveWidget = async () => {
    try {
      setSaving(true)
      setErrorMsg(null)
      const res = await fetch(`/api/dashboard/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectSlug, accentColor }),
      })
      if (res.ok) {
        setSavedMsg('Widget settings saved!')
        setTimeout(() => setSavedMsg(null), 2500)
      } else {
        const d = await res.json()
        setErrorMsg(d.error || 'Failed to save widget settings')
      }
    } catch {
      setErrorMsg('Error saving widget settings')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateKey = async () => {
    try {
      const name = prompt('Key name (e.g. CI/CD Pipeline):')
      if (!name) return
      const res = await fetch(`/api/dashboard/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectSlug, name, scopes: ['releases:read', 'releases:write'] }),
      })
      const data = await res.json()
      if (res.ok && data.key) {
        setApiKeys((prev) => [...prev, data.key])
      } else {
        setErrorMsg(data.error || 'Failed to create API key')
      }
    } catch {
      setErrorMsg('Failed to create API key')
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

  // Handle Checkout via Polar or Chapa
  const handleUpgrade = async (plan: 'pro' | 'team', provider: 'polar' | 'chapa') => {
    try {
      setPayingPlan(plan)
      setPayingProvider(provider)
      setErrorMsg(null)

      const endpoint = provider === 'polar' ? '/api/billing/polar/checkout' : '/api/billing/chapa/initialize'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectSlug, plan }),
      })

      const data = await res.json()

      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || `Failed to initiate ${provider} payment.`)
      }

      // Redirect to checkout URL
      window.location.href = data.checkoutUrl
    } catch (err: any) {
      console.error('Upgrade error:', err)
      setErrorMsg(err.message || 'Payment initiation failed. Please try again.')
      setPayingPlan(null)
      setPayingProvider(null)
    }
  }

  const currentPlan = billingData?.workspace?.plan || 'free'
  const usage = billingData?.usage || { projects: 1, aiGenerationsThisMonth: 0, apiKeys: 0 }
  const limits = billingData?.limits || { maxProjects: 1, maxAIGenerationsPerMonth: 20, maxSubscribersPerProject: 100 }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Project Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure project metadata, custom domains, in-app widget appearance, API keys, and subscription plan.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
        {[
          { id: 'general', label: 'General' },
          { id: 'domain', label: 'Custom Domain' },
          { id: 'widget', label: 'In-App Widget' },
          { id: 'api', label: 'API Keys' },
          { id: 'billing', label: 'Plans & Billing' },
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
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between gap-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="underline hover:text-rose-300">
            Dismiss
          </button>
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Custom Domain</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Serve your public changelog directly on your brand domain (e.g. changelog.acme.com).
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-indigo-500/40 text-indigo-400 text-[10px]">
                Pro &bull; Team
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Your Domain</label>
              <Input
                placeholder="updates.yourdomain.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                className="text-xs bg-slate-950 font-mono"
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1 font-mono">
              <p className="text-slate-300 font-sans font-semibold">DNS Configuration Required:</p>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div><span className="text-slate-500">Type:</span> CNAME</div>
                <div><span className="text-slate-500">Host:</span> updates (or @)</div>
                <div><span className="text-slate-500">Target:</span> cname.shippulse.app</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="glow" size="sm" className="text-xs" onClick={handleVerifyDomain} disabled={saving}>
                {saving ? 'Saving…' : 'Save Domain'}
              </Button>
              {domainVerified && (
                <span className="text-emerald-400 text-xs flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Domain Verified
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* IN-APP WIDGET */}
      {activeTab === 'widget' && (
        <Card className="border-slate-800 bg-slate-900/50 max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">In-App Notification Widget</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Customize the floating trigger and embed code for this project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-8 w-12 rounded cursor-pointer border border-slate-750 bg-slate-950"
                />
                <span className="text-xs font-mono text-slate-400">{accentColor}</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-medium text-slate-300">Embed Snippet</label>
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto">
                {`<script src="https://shippulse.app/widget.js" data-project="${projectSlug}" defer></script>`}
              </pre>
            </div>

            <Button variant="glow" size="sm" className="text-xs" onClick={handleSaveWidget} disabled={saving}>
              {saving ? 'Saving...' : 'Save Widget Settings'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* REST API KEYS */}
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

      {/* PLANS & BILLING */}
      {activeTab === 'billing' && (
        <div className="space-y-6 max-w-4xl">
          {/* Current Plan Overview Card */}
          <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>Current Subscription:</span>
                  <span className="uppercase text-indigo-400 font-extrabold">{currentPlan} Plan</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-0.5">
                  Managed for workspace: <strong className="text-white">{billingData?.workspace?.name || 'Active Workspace'}</strong>
                </CardDescription>
              </div>
              <Badge
                className={`text-xs px-2.5 py-1 uppercase font-bold tracking-wide ${
                  currentPlan === 'team'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                    : currentPlan === 'pro'
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {currentPlan} Active
              </Badge>
            </CardHeader>
            <CardContent>
              {billingLoading ? (
                <div className="flex items-center gap-2 py-4 text-xs text-slate-500">
                  <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
                  Loading usage and plan limits…
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {/* Projects usage */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <p className="text-[11px] text-slate-400 font-medium">Projects Capacity</p>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold text-white">{usage.projects}</span>
                      <span className="text-xs text-slate-500 font-mono">/ {limits.maxProjects} max</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, (usage.projects / limits.maxProjects) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* AI Generations usage */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <p className="text-[11px] text-slate-400 font-medium">Monthly AI Syncs</p>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold text-white">{usage.aiGenerationsThisMonth}</span>
                      <span className="text-xs text-slate-500 font-mono">/ {limits.maxAIGenerationsPerMonth} max</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (usage.aiGenerationsThisMonth / limits.maxAIGenerationsPerMonth) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Subscribers limit */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <p className="text-[11px] text-slate-400 font-medium">Subscribers Limit</p>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold text-white">{limits.maxSubscribersPerProject}</span>
                      <span className="text-xs text-slate-500">included</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upgrade Tier Cards */}
          <div>
            <h3 className="text-base font-bold text-white mb-1">Upgrade or Switch Plan</h3>
            <p className="text-xs text-slate-400 mb-4">
              Pay securely via <strong className="text-indigo-400">Polar.sh</strong> (Global Cards / USD) or <strong className="text-emerald-400">Chapa</strong> (ETB / Telebirr / CBE).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PRO TIER */}
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  currentPlan === 'pro'
                    ? 'border-indigo-500 bg-indigo-950/20 ring-1 ring-indigo-500/50'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-bold text-white">Pro Plan</h4>
                  <Badge variant="outline" className="text-[10px] text-indigo-400 border-indigo-500/30">
                    Fast-growing SaaS
                  </Badge>
                </div>
                <div className="mb-4">
                  <span className="text-2xl font-extrabold text-white">$19</span>
                  <span className="text-xs text-slate-400"> / month</span>
                  <span className="text-xs text-slate-500 block font-mono">or 2,500 ETB / month</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-300 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Up to <strong>5 Projects</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span><strong>500 AI releases</strong> / month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Up to <strong>2,000 subscribers</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Custom domain</strong> (changelog.you.com)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Remove ShipPulse branding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>REST API access & 5 API keys</span>
                  </li>
                </ul>

                {currentPlan === 'pro' ? (
                  <Button variant="outline" disabled className="w-full text-xs font-semibold h-10 border-indigo-500/40 text-indigo-300">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Current Active Plan
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant="glow"
                      onClick={() => handleUpgrade('pro', 'polar')}
                      disabled={payingPlan === 'pro'}
                      className="w-full text-xs font-semibold h-10 flex items-center justify-center gap-2"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>{payingPlan === 'pro' && payingProvider === 'polar' ? 'Connecting to Polar…' : 'Pay $19 with Polar.sh (Cards/USD)'}</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUpgrade('pro', 'chapa')}
                      disabled={payingPlan === 'pro'}
                      className="w-full text-xs font-semibold h-9 flex items-center justify-center gap-2 border-emerald-500/30 hover:bg-emerald-950/20 text-emerald-400"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>{payingPlan === 'pro' && payingProvider === 'chapa' ? 'Connecting to Chapa…' : 'Pay 2,500 ETB with Chapa (Telebirr/Cards)'}</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* TEAM TIER */}
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  currentPlan === 'team'
                    ? 'border-purple-500 bg-purple-950/20 ring-1 ring-purple-500/50'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-bold text-white">Team Plan</h4>
                  <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-500/30">
                    Scale & Multi-Team
                  </Badge>
                </div>
                <div className="mb-4">
                  <span className="text-2xl font-extrabold text-white">$49</span>
                  <span className="text-xs text-slate-400"> / month</span>
                  <span className="text-xs text-slate-500 block font-mono">or 6,500 ETB / month</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-300 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span>Up to <strong>20 Projects</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span><strong>2,000 AI releases</strong> / month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span>Up to <strong>10,000 subscribers</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span>Up to <strong>15 Team Members</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span>Full Security Audit Logs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span>Priority AI Generation Queue</span>
                  </li>
                </ul>

                {currentPlan === 'team' ? (
                  <Button variant="outline" disabled className="w-full text-xs font-semibold h-10 border-purple-500/40 text-purple-300">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Current Active Plan
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant="glow"
                      onClick={() => handleUpgrade('team', 'polar')}
                      disabled={payingPlan === 'team'}
                      className="w-full text-xs font-semibold h-10 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>{payingPlan === 'team' && payingProvider === 'polar' ? 'Connecting to Polar…' : 'Pay $49 with Polar.sh (Cards/USD)'}</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUpgrade('team', 'chapa')}
                      disabled={payingPlan === 'team'}
                      className="w-full text-xs font-semibold h-9 flex items-center justify-center gap-2 border-emerald-500/30 hover:bg-emerald-950/20 text-emerald-400"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>{payingPlan === 'team' && payingProvider === 'chapa' ? 'Connecting to Chapa…' : 'Pay 6,500 ETB with Chapa (Telebirr/Cards)'}</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
