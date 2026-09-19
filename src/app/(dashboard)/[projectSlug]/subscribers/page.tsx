'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Users,
  Download,
  Plus,
  Mail,
  CheckCircle2,
  Trash2,
  Search,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

type Subscriber = {
  id: string
  email: string
  status: 'confirmed' | 'pending'
  joinedAt: string
  releasesSent: number
}

export default function SubscribersPage() {
  const params = useParams()
  const projectSlug = params?.projectSlug as string

  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    async function fetchSubscribers() {
      try {
        setLoading(true)
        const res = await fetch(`/api/public/subscribe?projectSlug=${encodeURIComponent(projectSlug)}&list=true`)
        if (res.ok) {
          const data = await res.json()
          setSubscribers(data.subscribers || [])
        } else {
          setSubscribers([])
        }
      } catch {
        setSubscribers([])
      } finally {
        setLoading(false)
      }
    }
    if (projectSlug) fetchSubscribers()
  }, [projectSlug])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail) return
    try {
      setAdding(true)
      const res = await fetch('/api/public/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, projectSlug }),
      })
      if (res.ok) {
        setSubscribers((prev) => [
          { id: String(Date.now()), email: newEmail, status: 'confirmed', joinedAt: 'Just now', releasesSent: 0 },
          ...prev,
        ])
        setNewEmail('')
        setShowAddModal(false)
      }
    } catch (e) {
      console.error('Failed to add subscriber:', e)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = (id: string) => {
    setSubscribers((prev) => prev.filter((s) => s.id !== id))
  }

  const exportCsv = () => {
    const csvContent = 'data:text/csv;charset=utf-8,email,status,joined_at\n' +
      subscribers.map((s) => `${s.email},${s.status},${s.joinedAt}`).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${projectSlug}-subscribers.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filtered = subscribers.filter((s) =>
    !searchQuery || s.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Subscribers</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your audience, export contact lists, and broadcast email changelogs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} className="h-8 text-xs border-slate-750" disabled={subscribers.length === 0}>
            <Download className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
            Export CSV
          </Button>

          <Button variant="glow" size="sm" onClick={() => setShowAddModal(true)} className="h-8 text-xs font-semibold">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Subscriber
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by email..."
          className="h-9 w-full max-w-sm rounded-lg border border-slate-800 bg-slate-900/60 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Subscribers Table */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500 text-xs">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading subscribers...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-8 w-8 text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-300">
                {searchQuery ? 'No subscribers match your search' : 'No subscribers yet'}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                {searchQuery
                  ? 'Try a different email address.'
                  : 'Add your first subscriber or share your changelog link to grow your audience.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-medium">
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Joined</th>
                    <th className="px-5 py-3">Releases Sent</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filtered.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-white">{sub.email}</td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={`text-[10px] ${sub.status === 'confirmed' ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30'}`}>
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-400">{sub.joinedAt}</td>
                      <td className="px-5 py-3 text-slate-400">{sub.releasesSent}</td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => handleRemove(sub.id)} className="text-slate-500 hover:text-rose-400 p-1 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Subscriber Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <Card className="w-full max-w-sm border-slate-800 bg-slate-900 shadow-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add Subscriber</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Manually add an email address to your subscriber list.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-3">
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="bg-slate-950 text-xs"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="glow" size="sm" className="flex-1 text-xs" disabled={adding}>
                    {adding ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
