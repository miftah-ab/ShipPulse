'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import {
  Sparkles,
  Layers,
  GitBranch,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  ExternalLink,
  Plus,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  FolderGit2
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const params = useParams()
  const projectSlug = (params?.projectSlug as string) || ''
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)
  const [userProjects, setUserProjects] = useState<any[]>([])

  React.useEffect(() => {
    // Fetch real projects for the current user/workspace
    fetch('/api/projects')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.projects?.length) {
          setUserProjects(d.projects)
        }
      })
      .catch(() => {})
  }, [])

  const navItems = [
    { name: 'Releases', href: `/${projectSlug}/releases`, icon: Layers },
    { name: 'Git Repositories', href: `/${projectSlug}/integrations`, icon: GitBranch },
    { name: 'Subscribers', href: `/${projectSlug}/subscribers`, icon: Users },
    { name: 'Feedback & Reactions', href: `/${projectSlug}/feedback`, icon: MessageSquare },
    { name: 'Analytics', href: `/${projectSlug}/analytics`, icon: BarChart3 },
    { name: 'Project Settings', href: `/${projectSlug}/settings`, icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 border-r border-slate-800/80 bg-slate-950/60 backdrop-blur-xl flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Brand */}
          <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-base bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                ShipPulse
              </span>
            </Link>
          </div>

          {/* Project Switcher */}
          <div className="p-4 border-b border-slate-800/60 relative">
            <button
              onClick={() => setProjectMenuOpen(!projectMenuOpen)}
              className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="h-7 w-7 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <FolderGit2 className="h-4 w-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate capitalize">{projectSlug}</p>
                  <p className="text-[10px] text-slate-400 truncate">Production App</p>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {projectMenuOpen && (
              <div className="absolute top-18 left-4 right-4 z-50 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl space-y-1">
                <div className="px-2 py-1 text-[10px] uppercase font-semibold text-slate-500">Switch Project</div>
                {userProjects.length > 0 ? (
                  userProjects.map((p) => (
                    <Link
                      key={p.id}
                      href={`/${p.slug}/releases`}
                      onClick={() => setProjectMenuOpen(false)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 flex items-center justify-between ${
                        p.slug === projectSlug ? 'text-indigo-400 font-semibold bg-slate-800/60' : 'text-slate-300'
                      }`}
                    >
                      <span className="truncate">{p.name || p.slug}</span>
                      {p.slug === projectSlug && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
                    </Link>
                  ))
                ) : (
                  <div className="px-2.5 py-1.5 text-xs text-slate-400 font-medium">
                    {projectSlug || 'Active Project'}
                  </div>
                )}
                <Link
                  href="/onboarding"
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 flex items-center gap-1.5 text-indigo-400 mt-1 pt-2 border-t border-slate-800/80"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create new project</span>
                </Link>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <Link
            href={`/${projectSlug}`}
            target="_blank"
            className="w-full py-2 px-3 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-900 text-xs font-medium text-slate-300 flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5 text-indigo-400" />
              <span>Public Changelog</span>
            </span>
            <span className="text-[10px] text-slate-500">&rarr;</span>
          </Link>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-750 flex items-center justify-center text-xs font-bold text-slate-200">
                U
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-slate-200 truncate">Workspace User</p>
                <p className="text-[10px] text-slate-500">Pro Member</p>
              </div>
            </div>
            <Link href="/login" className="text-slate-500 hover:text-slate-300 p-1">
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-950/40 px-6 flex items-center justify-between backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search releases, commits, PRs... (⌘K)"
                className="h-9 w-64 md:w-80 rounded-lg border border-slate-800 bg-slate-900/80 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/${projectSlug}/releases/new`}>
              <Button size="sm" variant="glow" className="flex items-center gap-1.5 h-8 text-xs font-semibold">
                <Plus className="h-3.5 w-3.5" />
                <span>New Release</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Dynamic page container */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
