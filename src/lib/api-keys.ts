// ============================================================
// ShipPulse  -  API Key Management
// Hashed storage, show-once pattern, validation
// ============================================================

import { createHash, randomBytes } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

const KEY_PREFIX = 'sp_'
const KEY_PREFIX_DISPLAY_LEN = 8

/**
 * Generate a new API key.
 * Returns: the raw key (shown ONCE to user) + the hash to store.
 */
export function generateApiKey(): {
  rawKey: string      // shown once, not stored
  keyHash: string     // stored in DB
  keyPrefix: string   // stored for identification
} {
  const random = randomBytes(32).toString('hex')
  const rawKey = `${KEY_PREFIX}${random}`
  const keyHash = hashApiKey(rawKey)
  const keyPrefix = rawKey.slice(0, KEY_PREFIX_DISPLAY_LEN)

  return { rawKey, keyHash, keyPrefix }
}

/**
 * Hash an API key for storage.
 * Uses SHA-256  -  fast lookup, one-way.
 */
export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex')
}

/**
 * Validate an API key from a request.
 * Returns the key record if valid, null if invalid/revoked/expired.
 */
export async function validateApiKey(rawKey: string): Promise<{
  keyRecord: {
    id: string
    workspaceId: string
    projectId: string | null
    scopes: string[]
  }
} | null> {
  if (!rawKey || !rawKey.startsWith(KEY_PREFIX)) return null

  const keyHash = hashApiKey(rawKey)
  const supabase = createServiceClient()

  const { data: key, error } = await supabase
    .from('shippulse_api_keys')
    .select('id, workspace_id, project_id, scopes, revoked_at, expires_at')
    .eq('key_hash', keyHash)
    .single()

  if (error || !key) return null

  // Check revoked
  if (key.revoked_at) return null

  // Check expired
  if (key.expires_at && new Date(key.expires_at) < new Date()) return null

  // Update last_used_at (non-blocking)
  supabase
    .from('shippulse_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', key.id)
    .then(() => {}) // fire and forget

  return {
    keyRecord: {
      id: key.id,
      workspaceId: key.workspace_id,
      projectId: key.project_id,
      scopes: key.scopes,
    },
  }
}

/**
 * Check if an API key has the required scope.
 */
export function hasScope(scopes: string[], required: string): boolean {
  return scopes.includes('*') || scopes.includes(required)
}

/**
 * Extract API key from Authorization header.
 * Supports: "Bearer sp_..." or "ApiKey sp_..."
 */
export function extractApiKey(authHeader: string | null): string | null {
  if (!authHeader) return null

  const match = authHeader.match(/^(?:Bearer|ApiKey)\s+(sp_[a-f0-9]+)$/i)
  return match?.[1] ?? null
}
