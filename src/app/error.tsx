'use client'

import React, { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled ShipPulse application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 flex flex-col items-center justify-center p-4 text-center">
      <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mb-6">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-bold text-white tracking-tight">Something went wrong</h1>
      <p className="text-xs text-slate-400 mt-2 max-w-md">
        An unexpected error occurred while rendering this page. Our error reporting system has logged the details.
      </p>
      <Button
        onClick={() => reset()}
        variant="glow"
        size="sm"
        className="mt-6 flex items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        <span>Try Again</span>
      </Button>
    </div>
  )
}
