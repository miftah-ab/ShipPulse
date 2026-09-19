import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return formatDate(d)
}

/**
 * Sanitizes technical, internal, or raw developer error messages into clean, user-friendly copy.
 */
export function sanitizeErrorMessage(error: unknown, defaultMessage = 'An unexpected error occurred. Please try again.'): string {
  if (!error) return defaultMessage

  const raw = typeof error === 'string' ? error : (error as any)?.message || ''
  if (!raw) return defaultMessage

  const lower = raw.toLowerCase()

  // Supabase SSR / Missing env or API key
  if (lower.includes('supabase') || lower.includes('api key') || lower.includes('project\'s url') || lower.includes('anon key')) {
    return 'Authentication service is temporarily unavailable. Please refresh or try again in a moment.'
  }

  // Network / fetch failures
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('fetch failed')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.'
  }

  // Rate limit
  if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('429')) {
    return 'Too many requests. Please wait a moment before trying again.'
  }

  // GitHub OAuth / token errors
  if (lower.includes('oauth') || lower.includes('bad credentials') || lower.includes('github')) {
    return 'GitHub authentication could not be completed. Please try signing in again.'
  }

  // Database / SQL / Postgres internal errors
  if (lower.includes('relation') || lower.includes('column') || lower.includes('postgres') || lower.includes('syntax error') || lower.includes('pgrst')) {
    return 'We encountered a problem loading your data. Please refresh the page.'
  }

  // If it's already a clean human-readable sentence under 120 chars with no URLs or stack keywords, keep it
  if (raw.length <= 120 && !raw.includes('http://') && !raw.includes('https://') && !raw.includes('at ') && !raw.includes('Error:')) {
    return raw
  }

  return defaultMessage
}

