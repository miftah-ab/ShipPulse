// ============================================================
// ShipPulse  -  Polar.sh Payment & Subscription Gateway
// Official API: https://api.polar.sh/v1/
// Supports Global Credit Cards, Apple Pay, Google Pay, USD Subscriptions
// ============================================================

import crypto from 'crypto'

export interface PolarCheckoutParams {
  workspaceId: string
  projectSlug: string
  plan: 'pro' | 'team'
  email: string
  appUrl: string
}

export interface PolarCheckoutResult {
  success: boolean
  checkoutUrl?: string
  checkoutId?: string
  error?: string
}

/**
 * Initialize a Polar.sh checkout session for ShipPulse Pro or Team plan.
 */
export async function createPolarCheckout(params: PolarCheckoutParams): Promise<PolarCheckoutResult> {
  const token = process.env.POLAR_ACCESS_TOKEN
  const proProductId = process.env.POLAR_PRO_PRODUCT_ID
  const teamProductId = process.env.POLAR_TEAM_PRODUCT_ID

  const productId = params.plan === 'pro' ? proProductId : teamProductId
  const successUrl = `${params.appUrl}/${params.projectSlug}/settings?tab=billing&status=success&provider=polar&plan=${params.plan}`

  // Dev simulated mode if credentials are not configured or placeholder
  if (!token || token.includes('placeholder') || !productId || productId.includes('placeholder')) {
    console.warn('[Polar.sh] Running in development mode without live POLAR_ACCESS_TOKEN / PRODUCT_ID. Simulating checkout.')
    return {
      success: true,
      checkoutUrl: `${successUrl}&dev_simulated=true`,
      checkoutId: `polar_dev_${Date.now()}`,
    }
  }

  try {
    const response = await fetch('https://api.polar.sh/v1/checkouts/custom/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        customer_email: params.email,
        metadata: {
          workspace_id: params.workspaceId,
          plan: params.plan,
          project_slug: params.projectSlug,
        },
        success_url: successUrl,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.url) {
      // Fallback: direct polar checkout URL
      if (productId) {
        const directUrl = `https://polar.sh/checkout?product_id=${encodeURIComponent(productId)}&customer_email=${encodeURIComponent(params.email)}&metadata[workspace_id]=${encodeURIComponent(params.workspaceId)}&metadata[plan]=${params.plan}`
        return {
          success: true,
          checkoutUrl: directUrl,
          checkoutId: `polar_link_${Date.now()}`,
        }
      }

      return {
        success: false,
        error: data.detail || data.message || 'Failed to create Polar checkout session.',
      }
    }

    return {
      success: true,
      checkoutUrl: data.url,
      checkoutId: data.id,
    }
  } catch (err: any) {
    console.error('[Polar Checkout Exception]', err.message)
    return {
      success: false,
      error: err.message || 'Network error connecting to Polar.sh.',
    }
  }
}

/**
 * Verify HMAC signature of an incoming Polar.sh webhook event.
 */
export function verifyPolarWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false

  try {
    const hmac = crypto.createHmac('sha256', secret)
    const digest = hmac.update(rawBody).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signatureHeader))
  } catch {
    return false
  }
}
