'use client'

import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function GlobalRootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0A0D14] text-slate-100 flex flex-col items-center justify-center p-4 text-center">
        <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mb-6">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Service Temporarily Unavailable</h1>
        <p className="text-xs text-slate-400 mt-2 max-w-md">
          We encountered an unexpected issue while loading the application. Please try again or refresh the page.
        </p>
        <button
          onClick={() => reset()}
          className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Try Again</span>
        </button>
      </body>
    </html>
  )
}
