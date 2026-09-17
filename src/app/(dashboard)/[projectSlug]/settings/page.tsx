'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Settings,
  Globe,
  Radio,
  Key,
  ShieldAlert,
  CheckCircle2,
  Copy,
  Check,
  Plus,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function SettingsPage() {
  const params = useParams()
  const projectSlug = (params?.projectSlug as string) || 'demo'

  const [activeTab, setActiveTab] = useState<'general' | 'domain' | 'widget' | 'api'>('general')
  const [customDomain, setCustomDomain] = useState('updates.acme.com')
  const [domainVerified, setDomainVerified] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [accentColor, setAccentColor] = useState('#635BFF')

  const verifyDomain = () => {
    setTimeout(() => {
      setDomainVerified(true)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Project Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure project metadata, custom domains, in-app widget appearance, and API access keys.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
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

      {/* TAB: GENERAL */}
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
              <Input defaultValue={projectSlug} className="text-xs bg-slate-950" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Changelog URL Slug</label>
              <Input defaultValue={projectSlug} className="text-xs bg-slate-950 font-mono" />
            </div>
            <Button variant="glow" size="sm" className="text-xs mt-2">
              Save Changes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* TAB: CUSTOM DOMAIN */}
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
                <Button size="sm" variant="secondary" onClick={verifyDomain} className="text-xs shrink-0">
                  Verify DNS
                </Button>
              </div>
            </div>

            {domainVerified ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Domain verified and SSL active! Pointed to cname.shippulse.app</span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <p className="font-semibold text-slate-300">DNS Configuration:</p>
                <div className="font-mono text-[11px] text-slate-400 space-y-1">
                  <p>Type: <span className="text-white">CNAME</span></p>
                  <p>Name: <span className="text-white">updates</span></p>
                  <p>Target: <span className="text-indigo-400">cname.shippulse.app</span></p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB: IN-APP WIDGET */}
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

            <Button variant="glow" size="sm" className="text-xs">
              Save Widget Configuration
            </Button>
          </CardContent>
        </Card>
      )}

      {/* TAB: API KEYS */}
      {activeTab === 'api' && (
        <Card className="border-slate-800 bg-slate-900/50 max-w-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">REST API Keys</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Keys authenticate programmatic requests to ShipPulse API v1.
              </CardDescription>
            </div>
            <Button size="sm" variant="glow" className="text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create Key
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">CI/CD Automation Key</p>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">sp_live_9a8f...3d1e</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">releases:write</Badge>
                <button className="text-slate-500 hover:text-rose-400 p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
