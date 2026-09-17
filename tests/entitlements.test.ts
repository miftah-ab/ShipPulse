import { describe, it, expect } from 'vitest'
import { getPlanLimits, isFeatureAllowed } from '../src/lib/billing/entitlements'

describe('Billing Entitlement System', () => {
  it('enforces FREE plan limits', () => {
    const limits = getPlanLimits('free')
    expect(limits.maxProjects).toBe(1)
    expect(limits.maxAiGenerationsPerMonth).toBe(5)
    expect(limits.canUseCustomDomain).toBe(false)
    expect(limits.canRemoveWatermark).toBe(false)
  })

  it('enforces PRO plan limits', () => {
    const limits = getPlanLimits('pro')
    expect(limits.maxProjects).toBe(3)
    expect(limits.maxAiGenerationsPerMonth).toBe(Infinity)
    expect(limits.canUseCustomDomain).toBe(true)
    expect(limits.canRemoveWatermark).toBe(true)
  })

  it('enforces TEAM plan limits', () => {
    const limits = getPlanLimits('team')
    expect(limits.maxProjects).toBe(Infinity)
    expect(limits.canUseRestApi).toBe(true)
    expect(limits.canUseSlackRelay).toBe(true)
  })
})
