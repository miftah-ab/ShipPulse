// ============================================================
// ShipPulse  -  Chapa Payment Gateway Integration
// Official API: https://api.chapa.co/v1/
// Supports ETB, Telebirr, CBE Birr, Awash, and Cards
// ============================================================

export interface ChapaInitParams {
  workspaceId: string
  projectSlug: string
  plan: 'pro' | 'team'
  email: string
  name?: string
  appUrl: string
}

export interface ChapaInitResult {
  success: boolean
  checkoutUrl?: string
  txRef: string
  error?: string
}

export interface ChapaVerifyResult {
  success: boolean
  status?: string
  amount?: number
  currency?: string
  txRef?: string
  customer?: {
    email?: string
    name?: string
  }
  error?: string
}

/**
 * Initialize a Chapa checkout transaction for ShipPulse Pro or Team upgrade.
 */
export async function initializeChapaPayment(params: ChapaInitParams): Promise<ChapaInitResult> {
  const secretKey = process.env.CHAPA_SECRET_KEY

  const plan = params.plan
  const defaultAmount = plan === 'pro'
    ? Number(process.env.CHAPA_PRO_PRICE_ETB || 2500)
    : Number(process.env.CHAPA_TEAM_PRICE_ETB || 6500)

  // Unique transaction reference
  const txRef = `SP-${params.workspaceId.slice(0, 8)}-${plan}-${Date.now().toString(36)}`
  const returnUrl = `${params.appUrl}/${params.projectSlug}/settings?tab=billing&status=success&provider=chapa&tx_ref=${txRef}`
  const callbackUrl = `${params.appUrl}/api/billing/chapa/webhook`

  // Split name
  const nameParts = (params.name || 'ShipPulse User').trim().split(/\s+/)
  const firstName = nameParts[0] || 'Subscriber'
  const lastName = nameParts.slice(1).join(' ') || 'Customer'

  // If secret key is not set or placeholder, provide a seamless developer test redirect
  if (!secretKey || secretKey.includes('placeholder')) {
    console.warn('[Chapa] Running in development mode without live CHAPA_SECRET_KEY. Simulating checkout flow.')
    return {
      success: true,
      checkoutUrl: `${returnUrl}&dev_simulated=true`,
      txRef,
    }
  }

  try {
    const response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: defaultAmount.toString(),
        currency: 'ETB',
        email: params.email,
        first_name: firstName,
        last_name: lastName,
        tx_ref: txRef,
        callback_url: callbackUrl,
        return_url: returnUrl,
        customization: {
          title: `ShipPulse ${plan.toUpperCase()} Plan`,
          description: `Subscription for ${plan.toUpperCase()} plan on ShipPulse`,
        },
        meta: {
          workspace_id: params.workspaceId,
          plan: plan,
          project_slug: params.projectSlug,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok || data.status !== 'success' || !data.data?.checkout_url) {
      console.error('[Chapa Init Error]', data)
      return {
        success: false,
        txRef,
        error: data.message || 'Failed to initialize Chapa transaction.',
      }
    }

    return {
      success: true,
      checkoutUrl: data.data.checkout_url,
      txRef,
    }
  } catch (err: any) {
    console.error('[Chapa Exception]', err.message)
    return {
      success: false,
      txRef,
      error: err.message || 'Network error connecting to Chapa payment gateway.',
    }
  }
}

/**
 * Verify a Chapa transaction status via its transaction reference.
 */
export async function verifyChapaPayment(txRef: string): Promise<ChapaVerifyResult> {
  const secretKey = process.env.CHAPA_SECRET_KEY

  // In dev simulated mode
  if (!secretKey || secretKey.includes('placeholder')) {
    return {
      success: true,
      status: 'success',
      amount: 2500,
      currency: 'ETB',
      txRef,
    }
  }

  try {
    const response = await fetch(`https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(txRef)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    })

    const data = await response.json()

    if (!response.ok || data.status !== 'success') {
      return {
        success: false,
        error: data.message || 'Verification failed.',
      }
    }

    const payload = data.data
    const isSuccess = payload.status === 'success'

    return {
      success: isSuccess,
      status: payload.status,
      amount: Number(payload.amount),
      currency: payload.currency,
      txRef: payload.tx_ref,
      customer: {
        email: payload.email,
        name: `${payload.first_name || ''} ${payload.last_name || ''}`.trim(),
      },
    }
  } catch (err: any) {
    console.error('[Chapa Verify Exception]', err.message)
    return {
      success: false,
      error: err.message || 'Failed to verify transaction with Chapa.',
    }
  }
}
