import { SubscriptionTier, SUBSCRIPTION_FEATURES } from './subscription'
import { sendTokenLimitWarning } from './zoho-email'

export interface TokenLimitInfo {
  currentBalance: number
  currentLimit: number
  remainingTokens: number
  percentageUsed: number
  isNearLimit: boolean
  isAtLimit: boolean
  wouldExceedLimit: boolean
  recommendedUpgrade?: SubscriptionTier
}

export interface TokenPurchaseValidation {
  canPurchase: boolean
  reason?: string
  suggestedAmount?: number
  limitInfo: TokenLimitInfo
}

// Get token limit for a tier
export function getTokenLimit(tier: SubscriptionTier): number {
  return SUBSCRIPTION_FEATURES[tier].maxTokens
}

// Check if user can purchase tokens
export function canPurchaseTokens(
  tier: SubscriptionTier,
  currentBalance: number,
  purchaseAmount: number
): TokenPurchaseValidation {
  const limit = getTokenLimit(tier)
  const newBalance = currentBalance + purchaseAmount
  const limitInfo = getTokenLimitInfo(tier, currentBalance)
  
  // Free users cannot purchase tokens
  if (tier === 'free') {
    return {
      canPurchase: false,
      reason: 'Free users cannot purchase tokens. Please upgrade to a paid plan.',
      limitInfo
    }
  }
  
  // Check if purchase would exceed limit
  if (limit !== -1 && newBalance > limit) {
    const overBy = newBalance - limit
    const suggestedAmount = Math.max(0, limit - currentBalance)
    
    return {
      canPurchase: false,
      reason: `This purchase would exceed your ${tier} plan limit of ${limit} tokens by ${overBy} tokens.`,
      suggestedAmount: suggestedAmount > 0 ? suggestedAmount : 0,
      limitInfo
    }
  }
  
  return {
    canPurchase: true,
    limitInfo
  }
}

// Get detailed token limit information
export function getTokenLimitInfo(tier: SubscriptionTier, currentBalance: number): TokenLimitInfo {
  const limit = getTokenLimit(tier)
  const remainingTokens = limit === -1 ? -1 : Math.max(0, limit - currentBalance)
  const percentageUsed = limit === -1 ? 0 : (currentBalance / limit) * 100
  
  // Consider "near limit" when 80% or more is used
  const isNearLimit = limit !== -1 && percentageUsed >= 80
  const isAtLimit = limit !== -1 && currentBalance >= limit
  
  return {
    currentBalance,
    currentLimit: limit,
    remainingTokens,
    percentageUsed,
    isNearLimit,
    isAtLimit,
    wouldExceedLimit: false,
    recommendedUpgrade: getRecommendedUpgrade(tier, currentBalance, limit)
  }
}

// Get recommended upgrade tier
export function getRecommendedUpgrade(
  tier: SubscriptionTier, 
  currentBalance: number, 
  limit: number
): SubscriptionTier | undefined {
  if (tier === 'free') return 'basic'
  if (tier === 'basic' && (limit === -1 || currentBalance >= limit * 0.8)) return 'pro'
  if (tier === 'pro' && (limit === -1 || currentBalance >= limit * 0.8)) return 'enterprise'
  return undefined
}

// Check if user should be warned about token limits
export function shouldWarnAboutTokenLimit(tier: SubscriptionTier, currentBalance: number): boolean {
  const limit = getTokenLimit(tier)
  if (limit === -1) return false // Unlimited
  
  const percentageUsed = (currentBalance / limit) * 100
  return percentageUsed >= 80 // Warn when 80% or more is used
}

// Send token limit warning email
export async function sendTokenLimitWarningEmail(
  userEmail: string,
  userName: string,
  tier: SubscriptionTier,
  currentBalance: number
): Promise<boolean> {
  const limit = getTokenLimit(tier)
  
  if (limit === -1) return false // No limit to warn about
  
  return await sendTokenLimitWarning(
    userEmail,
    userName,
    tier,
    currentBalance,
    limit
  )
}

// Validate token usage before sending messages
export function validateTokenUsage(
  tier: SubscriptionTier,
  currentBalance: number,
  tokensToUse: number
): { canUse: boolean; reason?: string; limitInfo: TokenLimitInfo } {
  const limitInfo = getTokenLimitInfo(tier, currentBalance)
  
  // Check if user has enough tokens
  if (currentBalance < tokensToUse) {
    return {
      canUse: false,
      reason: `Insufficient tokens. You have ${currentBalance} tokens but need ${tokensToUse} tokens.`,
      limitInfo
    }
  }
  
  // Check if usage would exceed limit (for tiered limits)
  const newBalance = currentBalance - tokensToUse
  const limit = getTokenLimit(tier)
  
  if (limit !== -1 && newBalance < 0) {
    return {
      canUse: false,
      reason: `This action would exceed your ${tier} plan token limit.`,
      limitInfo
    }
  }
  
  return {
    canUse: true,
    limitInfo
  }
}

// Get upgrade prompt message
export function getUpgradePromptMessage(
  tier: SubscriptionTier,
  currentBalance: number,
  reason: 'limit_reached' | 'near_limit' | 'insufficient_tokens'
): string {
  const limit = getTokenLimit(tier)
  
  switch (reason) {
    case 'limit_reached':
      return `You've reached your ${tier} plan token limit of ${limit} tokens. Upgrade to Pro for unlimited tokens!`
    
    case 'near_limit':
      const remaining = limit - currentBalance
      return `You're running low on tokens (${remaining} remaining). Consider upgrading to Pro for unlimited tokens!`
    
    case 'insufficient_tokens':
      return `You don't have enough tokens for this action. Upgrade to Pro for unlimited tokens!`
    
    default:
      return 'Consider upgrading to Pro for unlimited tokens!'
  }
}

// Calculate optimal token purchase amount
export function calculateOptimalPurchaseAmount(
  tier: SubscriptionTier,
  currentBalance: number,
  desiredAmount: number
): { amount: number; reason: string } {
  const limit = getTokenLimit(tier)
  
  if (limit === -1) {
    // Unlimited plan - can purchase any amount
    return { amount: desiredAmount, reason: 'Unlimited plan - no restrictions' }
  }
  
  const remainingSpace = limit - currentBalance
  
  if (remainingSpace <= 0) {
    return { 
      amount: 0, 
      reason: `You've reached your ${tier} plan limit. Consider upgrading to Pro for unlimited tokens.` 
    }
  }
  
  if (desiredAmount <= remainingSpace) {
    return { 
      amount: desiredAmount, 
      reason: `Purchase within your ${tier} plan limits` 
    }
  }
  
  return { 
    amount: remainingSpace, 
    reason: `Limited to ${remainingSpace} tokens to stay within your ${tier} plan limit. Consider upgrading to Pro for unlimited tokens.` 
  }
} 