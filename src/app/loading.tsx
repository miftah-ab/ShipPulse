import React from 'react'
import { Sparkles } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0D14] flex flex-col items-center justify-center p-4">
      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse mb-4">
        <Sparkles className="h-5 w-5 text-white animate-spin" />
      </div>
      <p className="text-xs font-medium text-slate-400">Loading ShipPulse...</p>
    </div>
  )
}
