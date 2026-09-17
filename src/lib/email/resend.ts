// ============================================================
// ShipPulse  -  Resend Email Service
// Real email sending via Resend API
// ============================================================

import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new EmailNotConfiguredError()
  }
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'updates@shippulse.vercel.app'
const FROM_NAME = process.env.RESEND_FROM_NAME ?? 'ShipPulse'

export class EmailNotConfiguredError extends Error {
  constructor() {
    super('Email sending is not configured. Add RESEND_API_KEY to your environment variables.')
    this.name = 'EmailNotConfiguredError'
  }
}

// ── Subscriber confirmation ──────────────────────────────────
export async function sendSubscriberConfirmation(options: {
  to: string
  confirmUrl: string
  projectName: string
  unsubscribeUrl: string
}): Promise<void> {
  const resend = getResend()

  await resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to: options.to,
    subject: `Confirm your subscription to ${options.projectName} updates`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: Inter, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #0B0D12;">
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Confirm your subscription</h1>
  <p style="color: #4B5563; line-height: 1.6;">
    You've requested to subscribe to <strong>${escapeHtml(options.projectName)}</strong> product updates.
    Click the button below to confirm.
  </p>
  <a href="${options.confirmUrl}" 
     style="display: inline-block; background: #635BFF; color: white; padding: 12px 24px; 
            border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0;">
    Confirm subscription
  </a>
  <p style="color: #9CA3AF; font-size: 14px; margin-top: 32px;">
    If you didn't request this, you can ignore this email.<br>
    <a href="${options.unsubscribeUrl}" style="color: #9CA3AF;">Unsubscribe</a>
  </p>
  <p style="color: #9CA3AF; font-size: 12px; border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 24px;">
    Sent by <a href="https://shippulse.vercel.app" style="color: #635BFF;">ShipPulse</a>
  </p>
</body>
</html>`,
  })
}

// ── Release notification ─────────────────────────────────────
export async function sendReleaseNotification(options: {
  to: string[]
  projectName: string
  releaseTitle: string
  releaseSummary: string
  releaseUrl: string
  unsubscribeUrl: string
  category?: string
}): Promise<{ sent: number; failed: number }> {
  const resend = getResend()

  // Send in batches of 50 (Resend limit)
  const batchSize = 50
  let sent = 0
  let failed = 0

  for (let i = 0; i < options.to.length; i += batchSize) {
    const batch = options.to.slice(i, i + batchSize)

    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM}>`,
        to: batch,
        subject: `${options.projectName}: ${options.releaseTitle}`,
        html: `
<!DOCTYPE html>
<html>
<body style="font-family: Inter, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #0B0D12;">
  ${options.category ? `<span style="background: #F3F4F6; color: #635BFF; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 600;">${escapeHtml(options.category)}</span>` : ''}
  <h1 style="font-size: 24px; font-weight: 700; margin-top: 16px;">${escapeHtml(options.releaseTitle)}</h1>
  <p style="color: #4B5563; line-height: 1.6;">${escapeHtml(options.releaseSummary)}</p>
  <a href="${options.releaseUrl}" 
     style="display: inline-block; background: #635BFF; color: white; padding: 12px 24px; 
            border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0;">
    Read the full update
  </a>
  <p style="color: #9CA3AF; font-size: 12px; border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 32px;">
    You're receiving this because you subscribed to <strong>${escapeHtml(options.projectName)}</strong> updates.<br>
    <a href="${options.unsubscribeUrl}" style="color: #9CA3AF;">Unsubscribe</a>
  </p>
</body>
</html>`,
      })
      sent += batch.length
    } catch (err) {
      console.error('[Email] Batch send failed:', err instanceof Error ? err.message : err)
      failed += batch.length
    }
  }

  return { sent, failed }
}

// ── Team invitation ──────────────────────────────────────────
export async function sendTeamInvitation(options: {
  to: string
  invitedBy: string
  workspaceName: string
  role: string
  acceptUrl: string
  expiresAt: string
}): Promise<void> {
  const resend = getResend()

  await resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to: options.to,
    subject: `${options.invitedBy} invited you to ${options.workspaceName} on ShipPulse`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: Inter, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #0B0D12;">
  <h1 style="font-size: 24px; font-weight: 700;">You've been invited</h1>
  <p style="color: #4B5563; line-height: 1.6;">
    <strong>${escapeHtml(options.invitedBy)}</strong> has invited you to join 
    <strong>${escapeHtml(options.workspaceName)}</strong> on ShipPulse as a <strong>${escapeHtml(options.role)}</strong>.
  </p>
  <a href="${options.acceptUrl}" 
     style="display: inline-block; background: #635BFF; color: white; padding: 12px 24px; 
            border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0;">
    Accept invitation
  </a>
  <p style="color: #9CA3AF; font-size: 14px;">
    This invitation expires on ${new Date(options.expiresAt).toLocaleDateString()}.
  </p>
</body>
</html>`,
  })
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
