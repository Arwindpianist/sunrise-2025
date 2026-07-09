import { SubscriptionTier, SUBSCRIPTION_FEATURES, hasReachedContactLimit, hasReachedEventLimit } from './subscription'

// Client-side version of limit checking functions
// These functions make API calls instead of direct database queries

// Check if user can create more contacts (client-side)
export async function canCreateContactClient(): Promise<{ allowed: boolean; currentCount: number; maxAllowed: number; tier: SubscriptionTier; limitInfo: any }> {
  try {
    const response = await fetch('/api/subscription/limits', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to check contact limits')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error checking contact creation limit:', error)
    return { 
      allowed: false, 
      currentCount: 0, 
      maxAllowed: 0, 
      tier: 'free',
      limitInfo: {
        current: 0,
        max: 0,
        remaining: 0,
        percentage: 0,
        isUnlimited: false
      }
    }
  }
}

// Check if user can create more events (client-side)
export async function canCreateEventClient(): Promise<{ allowed: boolean; currentCount: number; maxAllowed: number; tier: SubscriptionTier; limitInfo: any }> {
  try {
    const response = await fetch('/api/subscription/limits?type=events', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to check event limits')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error checking event creation limit:', error)
    return { 
      allowed: false, 
      currentCount: 0, 
      maxAllowed: 0, 
      tier: 'free',
      limitInfo: {
        current: 0,
        max: 0,
        remaining: 0,
        percentage: 0,
        isUnlimited: false
      }
    }
  }
}

// Get limit information for display (client-side)
export function getLimitInfo(tier: SubscriptionTier, currentCount: number, type: 'contacts' | 'events') {
  const features = SUBSCRIPTION_FEATURES[tier]
  const maxAllowed = type === 'contacts' ? features.maxContacts : features.maxEvents
  const isUnlimited = maxAllowed === -1
  
  if (isUnlimited) {
    return {
      current: currentCount,
      max: 'Unlimited',
      remaining: 'Unlimited',
      percentage: 0,
      isUnlimited: true
    }
  }

  const remaining = Math.max(0, maxAllowed - currentCount)
  const percentage = Math.min(100, (currentCount / maxAllowed) * 100)

  return {
    current: currentCount,
    max: maxAllowed,
    remaining,
    percentage,
    isUnlimited: false
  }
}

// Get upgrade recommendation for limits (client-side)
export function getLimitUpgradeRecommendation(tier: SubscriptionTier, type: 'contacts' | 'events'): { recommended: SubscriptionTier; reason: string } | null {
  if (tier === 'enterprise') return null

  const currentLimit = type === 'contacts' 
    ? SUBSCRIPTION_FEATURES[tier].maxContacts 
    : SUBSCRIPTION_FEATURES[tier].maxEvents

  const nextTier = tier === 'free' ? 'basic' : tier === 'basic' ? 'pro' : 'enterprise'
  const nextLimit = type === 'contacts' 
    ? SUBSCRIPTION_FEATURES[nextTier].maxContacts 
    : SUBSCRIPTION_FEATURES[nextTier].maxEvents

  if (nextLimit === -1) {
    return {
      recommended: nextTier,
      reason: `Upgrade to ${SUBSCRIPTION_FEATURES[nextTier].name} for unlimited ${type}`
    }
  }

  return {
    recommended: nextTier,
    reason: `Upgrade to ${SUBSCRIPTION_FEATURES[nextTier].name} for up to ${nextLimit} ${type}`
  }
} 