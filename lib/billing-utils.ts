import { SubscriptionTier, SUBSCRIPTION_FEATURES } from './subscription'

export interface ProrationInfo {
  daysRemaining: number
  daysInPeriod: number
  prorationRatio: number
  proratedTokens: number
  proratedAmount: number
}

export interface PlanChangeInfo {
  fromTier: SubscriptionTier
  toTier: SubscriptionTier
  currentPeriodStart: Date
  currentPeriodEnd: Date
  prorationInfo: ProrationInfo
}

// Calculate proration information for plan changes
export function calculateProration(
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  changeDate: Date = new Date()
): ProrationInfo {
  const totalDays = Math.ceil((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.ceil((currentPeriodEnd.getTime() - changeDate.getTime()) / (1000 * 60 * 60 * 24))
  const prorationRatio = Math.max(0, daysRemaining / totalDays)
  
  return {
    daysRemaining,
    daysInPeriod: totalDays,
    prorationRatio,
    proratedTokens: 0, // Will be calculated based on plan
    proratedAmount: 0  // Will be calculated based on plan
  }
}

// Calculate prorated tokens for a plan change
export function calculateProratedTokens(
  fromTier: SubscriptionTier,
  toTier: SubscriptionTier,
  prorationInfo: ProrationInfo
): number {
  const fromFeatures = SUBSCRIPTION_FEATURES[fromTier]
  const toFeatures = SUBSCRIPTION_FEATURES[toTier]
  
  // Calculate tokens for remaining period on old plan
  const fromTokens = Math.floor(fromFeatures.monthlyTokens * prorationInfo.prorationRatio)
  
  // Calculate tokens for remaining period on new plan
  const toTokens = Math.floor(toFeatures.monthlyTokens * prorationInfo.prorationRatio)
  
  // Return the difference (positive for upgrade, negative for downgrade)
  return toTokens - fromTokens
}

// Calculate prorated amount for billing
export function calculateProratedAmount(
  fromTier: SubscriptionTier,
  toTier: SubscriptionTier,
  prorationInfo: ProrationInfo
): number {
  const fromFeatures = SUBSCRIPTION_FEATURES[fromTier]
  const toFeatures = SUBSCRIPTION_FEATURES[toTier]
  
  // Calculate amount for remaining period on old plan
  const fromAmount = fromFeatures.monthlyPrice * prorationInfo.prorationRatio
  
  // Calculate amount for remaining period on new plan
  const toAmount = toFeatures.monthlyPrice * prorationInfo.prorationRatio
  
  // Return the difference (positive for upgrade, negative for downgrade)
  return toAmount - fromAmount
}

// Get plan change information
export function getPlanChangeInfo(
  fromTier: SubscriptionTier,
  toTier: SubscriptionTier,
  currentPeriodStart: string,
  currentPeriodEnd: string
): PlanChangeInfo {
  const startDate = new Date(currentPeriodStart)
  const endDate = new Date(currentPeriodEnd)
  const prorationInfo = calculateProration(startDate, endDate)
  
  // Calculate prorated values
  prorationInfo.proratedTokens = calculateProratedTokens(fromTier, toTier, prorationInfo)
  prorationInfo.proratedAmount = calculateProratedAmount(fromTier, toTier, prorationInfo)
  
  return {
    fromTier,
    toTier,
    currentPeriodStart: startDate,
    currentPeriodEnd: endDate,
    prorationInfo
  }
}

// Check if this is a plan upgrade or downgrade
export function isPlanUpgrade(fromTier: SubscriptionTier, toTier: SubscriptionTier): boolean {
  const tierOrder = ['free', 'basic', 'pro', 'enterprise']
  const fromIndex = tierOrder.indexOf(fromTier)
  const toIndex = tierOrder.indexOf(toTier)
  
  return toIndex > fromIndex
}

// Format proration information for display
export function formatProrationInfo(prorationInfo: ProrationInfo): string {
  const percentage = Math.round(prorationInfo.prorationRatio * 100)
  return `${percentage}% of billing period remaining (${prorationInfo.daysRemaining} days)`
}

// Calculate effective monthly rate for prorated periods
export function calculateEffectiveMonthlyRate(
  basePrice: number,
  prorationRatio: number
): number {
  return basePrice * prorationRatio
} 