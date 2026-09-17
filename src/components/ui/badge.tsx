import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'feature' | 'fix' | 'perf' | 'breaking' | 'security'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    secondary: 'bg-slate-800 text-slate-300 border-slate-700',
    outline: 'border-slate-700 text-slate-400 bg-transparent',
    feature: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    fix: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    perf: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    breaking: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    security: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
