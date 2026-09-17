// ============================================================
// ShipPulse  -  Entitlement System
// Plan-based feature enforcement  -  always server-side.
// Never trust client-side plan checks.
// ============================================================

export type Plan = 'free' | 'pro' | 'team'

export interface PlanLimits {
  maxProjects: number
  maxRepositoriesPerProject: number
  maxAIGenerationsPerMonth: number
  maxSubscribersPerProject: number
  maxApiKeysPerWorkspace: number
  maxTeamMembers: number
  maxWebhookEndpoints: number
  maxStorageMB: number
  analyticsRetentionDays: number
  canUseCustomDomain: boolean
  canUseAdvancedAnalytics: boolean
  canUseCustomBranding: boolean
  canRemoveBranding: boolean
  canUseApi: boolean
  canUseTeamMembers: boolean
  canUseAuditLog: boolean
  canUseSlack: boolean
  canUseDiscord: boolean
  canUseAdvancedAI: boolean
  canScheduleReleases: boolean
  canUseCustomAIInstructions: boolean
}

const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxProjects: 1,
    maxRepositoriesPerProject: 1,
    maxAIGenerationsPerMonth: 20,
    maxSubscribersPerProject: 100,
    maxApiKeysPerWorkspace: 0,
    maxTeamMembers: 1,
    maxWebhookEndpoints: 0,
    maxStorageMB: 50,
    analyticsRetentionDays: 30,
    canUseCustomDomain: false,
    canUseAdvancedAnalytics: false,
    canUseCustomBranding: false,
    canRemoveBranding: false,
    canUseApi: false,
    canUseTeamMembers: false,
    canUseAuditLog: false,
    canUseSlack: false,
    canUseDiscord: false,
    canUseAdvancedAI: false,
    canScheduleReleases: false,
    canUseCustomAIInstructions: false,
  },
  pro: {
    maxProjects: 5,
    maxRepositoriesPerProject: 3,
    maxAIGenerationsPerMonth: 500,
    maxSubscribersPerProject: 2000,
    maxApiKeysPerWorkspace: 5,
    maxTeamMembers: 1,
    maxWebhookEndpoints: 5,
    maxStorageMB: 500,
    analyticsRetentionDays: 180,
    canUseCustomDomain: true,
    canUseAdvancedAnalytics: true,
    canUseCustomBranding: true,
    canRemoveBranding: true,
    canUseApi: true,
    canUseTeamMembers: false,
    canUseAuditLog: false,
    canUseSlack: true,
    canUseDiscord: true,
    canUseAdvancedAI: true,
    canScheduleReleases: true,
    canUseCustomAIInstructions: true,
  },
  team: {
    maxProjects: 20,
    maxRepositoriesPerProject: 10,
    maxAIGenerationsPerMonth: 2000,
    maxSubscribersPerProject: 10000,
    maxApiKeysPerWorkspace: 20,
    maxTeamMembers: 15,
    maxWebhookEndpoints: 20,
    maxStorageMB: 2000,
    analyticsRetentionDays: 365,
    canUseCustomDomain: true,
    canUseAdvancedAnalytics: true,
    canUseCustomBranding: true,
    canRemoveBranding: true,
    canUseApi: true,
    canUseTeamMembers: true,
    canUseAuditLog: true,
    canUseSlack: true,
    canUseDiscord: true,
    canUseAdvancedAI: true,
    canScheduleReleases: true,
    canUseCustomAIInstructions: true,
  },
}

// ── Main entitlement class ───────────────────────────────────
export class Entitlements {
  private limits: PlanLimits
  readonly plan: Plan

  constructor(plan: Plan) {
    this.plan = plan
    this.limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
  }

  get maxProjects()                  { return this.limits.maxProjects }
  get maxRepositoriesPerProject()    { return this.limits.maxRepositoriesPerProject }
  get maxAIGenerationsPerMonth()     { return this.limits.maxAIGenerationsPerMonth }
  get maxSubscribersPerProject()     { return this.limits.maxSubscribersPerProject }
  get maxApiKeysPerWorkspace()       { return this.limits.maxApiKeysPerWorkspace }
  get maxTeamMembers()               { return this.limits.maxTeamMembers }
  get maxWebhookEndpoints()          { return this.limits.maxWebhookEndpoints }
  get maxStorageMB()                 { return this.limits.maxStorageMB }
  get analyticsRetentionDays()       { return this.limits.analyticsRetentionDays }

  get canUseCustomDomain()           { return this.limits.canUseCustomDomain }
  get canUseAdvancedAnalytics()      { return this.limits.canUseAdvancedAnalytics }
  get canUseCustomBranding()         { return this.limits.canUseCustomBranding }
  get canRemoveBranding()            { return this.limits.canRemoveBranding }
  get canUseApi()                    { return this.limits.canUseApi }
  get canUseTeamMembers()            { return this.limits.canUseTeamMembers }
  get canUseAuditLog()               { return this.limits.canUseAuditLog }
  get canUseSlack()                  { return this.limits.canUseSlack }
  get canUseDiscord()                { return this.limits.canUseDiscord }
  get canUseAdvancedAI()             { return this.limits.canUseAdvancedAI }
  get canScheduleReleases()          { return this.limits.canScheduleReleases }
  get canUseCustomAIInstructions()   { return this.limits.canUseCustomAIInstructions }

  /**
   * Check a named feature and throw a descriptive error if not allowed.
   * Call this server-side before performing any restricted operation.
   */
  require(feature: keyof PlanLimits): void {
    const value = this.limits[feature]
    if (value === false || value === 0) {
      throw new EntitlementError(feature, this.plan)
    }
  }

  /**
   * Check a numeric limit against current usage.
   * Returns { allowed, remaining }.
   */
  checkLimit(
    feature: keyof PlanLimits,
    currentUsage: number
  ): { allowed: boolean; remaining: number; limit: number } {
    const limit = this.limits[feature] as number
    const remaining = Math.max(0, limit - currentUsage)
    return { allowed: currentUsage < limit, remaining, limit }
  }

  toJSON(): PlanLimits & { plan: Plan } {
    return { plan: this.plan, ...this.limits }
  }
}

export class EntitlementError extends Error {
  readonly feature: string
  readonly currentPlan: Plan
  readonly upgradeRequired: Plan

  constructor(feature: string, currentPlan: Plan) {
    const upgradeRequired: Plan = currentPlan === 'free' ? 'pro' : 'team'
    super(
      `Your ${currentPlan} plan does not include "${feature}". ` +
      `Upgrade to ${upgradeRequired} to unlock this feature.`
    )
    this.name = 'EntitlementError'
    this.feature = feature
    this.currentPlan = currentPlan
    this.upgradeRequired = upgradeRequired
  }
}

/**
 * Factory: create Entitlements from a workspace record.
 */
export function getEntitlements(workspace: { plan: string }): Entitlements {
  const plan = (workspace.plan as Plan) ?? 'free'
  return new Entitlements(plan)
}

/**
 * Get raw plan limits for a given plan (for display in pricing pages).
 */
export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan]
}

export { PLAN_LIMITS }
