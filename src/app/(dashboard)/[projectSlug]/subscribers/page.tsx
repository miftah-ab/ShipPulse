'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Users,
  Download,
  Plus,
  Mail,
  CheckCircle2,
  Trash2,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function SubscribersPage() {
  const params = useParams()
  const projectSlug = (params?.projectSlug as string) || 'demo'

  const [subscribers, setSubscribers] = useState([
    { id: '1', email: 'alex@acme.dev', status: 'confirmed', joinedAt: 'Sep 10, 2026', releasesSent: 3 },
    { id: '2', email: 'sarah@startup.io', status: 'confirmed', joinedAt: 'Sep 08, 2026', releasesSent: 3 },
    { id: '3', email: 'jordan@techcorp.com', status: 'pending', joinedAt: 'Sep 12, 2026', releasesSent: 0 },
  ])
  const [newEmail, setNewEmail] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail) return
    setSubscribers((prev) => [
      { id: String(Date.now()), email: newEmail, status: 'confirmed', joinedAt: 'Just now', releasesSent: 0 },
      ...prev,
    ])
    setNewEmail('')
    setShowAddModal(false)
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
          <Button variant="outline" size="sm" onClick={exportCsv} className="h-8 text-xs border-slate-750">
            <Download className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
            Export CSV
          </Button>

          <Button variant="glow" size="sm" onClick={() => setShowAddModal(true)} className="h-8 text-xs font-semibold">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Subscriber
          </Button>
        </div>
      </div>

      {/* Subscribers Table */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Confirmation Status</th>
                  <th className="py-3 px-4">Subscribed Date</th>
                  <th className="py-3 px-4">Releases Delivered</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {subscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-850/30">
                    <td className="py-3.5 px-4 font-medium text-white">{sub.email}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={sub.status === 'confirmed' ? 'feature' : 'fix'} className="text-[10px] capitalize">
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{sub.joinedAt}</td>
                    <td className="py-3.5 px-4 text-slate-300">{sub.releasesSent} sent</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSubscribers((prev) => prev.filter((s) => s.id !== sub.id))}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Remove subscriber"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <Card className="w-full max-w-md border-slate-800 bg-slate-900 shadow-2xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Add Email Subscriber</CardTitle>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white">✕</button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Subscriber Email</label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="bg-slate-950 border-slate-800 text-xs"
                  />
                </div>
                <Button type="submit" variant="glow" className="w-full text-xs">
                  Add to List
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
