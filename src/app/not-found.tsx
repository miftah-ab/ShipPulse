import React from 'react'
import Link from 'next/link'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 flex flex-col items-center justify-center p-4 text-center">
      <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-6">
        <Sparkles className="h-6 w-6" />
      </div>
      <h1 className="text-4xl font-extrabold text-white tracking-tight">404</h1>
      <h2 className="text-xl font-bold text-slate-200 mt-2">Page Not Found</h2>
      <p className="text-xs text-slate-400 mt-2 max-w-sm">
        The product changelog, release note, or dashboard route you are looking for does not exist or has been moved.
      </p>
      <Link href="/" className="mt-6">
        <Button variant="glow" size="sm" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Button>
      </Link>
    </div>
  )
}
