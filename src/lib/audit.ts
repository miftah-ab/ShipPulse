// ============================================================
// ShipPulse — Audit Logger
// Records all important actions server-side
// ============================================================

import { createServiceClient } from '@/lib/supabase/server'

export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.delete_account'
  | 'workspace.created'
  | 'workspace.updated'
  | 'workspace.deleted'
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'repository.connected'
  | 'repository.disconnected'
  | 'repository.synced'
  | 'release.generated'
  | 'release.published'
  | 'release.unpublished'
  | 'release.archived'
  | 'release.deleted'
  | 'member.invited'
  | 'member.removed'
  | 'member.role_changed'
  | 'member.left'
  | 'api_key.created'
  | 'api_key.revoked'
  | 'domain.added'
  | 'domain.verified'
  | 'domain.removed'
  | 'webhook.created'
  | 'webhook.deleted'
  | 'integration.connected'
  | 'integration.disconnected'
  | 'billing.plan_changed'
  | 'settings.updated'
  | 'github.token_connected'
  | 'github.token_revoked'
  | 'security.unauthorized_access_attempt'

export interface AuditLogEntry {
  workspaceId?: string
  projectId?: string
  userId?: string
  action: AuditAction
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Record an audit log entry.
 * Uses service role — never fails silently in production.
 * Does not throw — audit logging failure must not disrupt the main operation.
 */
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createServiceClient()
    await supabase.from('shippulse_audit_logs').insert({
      workspace_id: entry.workspaceId ?? null,
      project_id: entry.projectId ?? null,
      user_id: entry.userId ?? null,
      action: entry.action,
      resource_type: entry.resourceType ?? null,
      resource_id: entry.resourceId ?? null,
      metadata: entry.metadata ?? {},
      ip_address: entry.ipAddress ?? null,
      user_agent: entry.userAgent ?? null,
    })
  } catch (err) {
    // Log to console but never throw — audit failure must not break the app
    console.error('[AuditLog] Failed to write audit entry:', {
      action: entry.action,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

/**
 * Extract request metadata for audit logging
 */
export function getRequestMetadata(request: Request): {
  ipAddress?: string
  userAgent?: string
} {
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? request.headers.get('x-real-ip')
    ?? undefined
  const userAgent = request.headers.get('user-agent') ?? undefined
  return { ipAddress, userAgent }
}
