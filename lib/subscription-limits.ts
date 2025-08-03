import { SubscriptionTier, SUBSCRIPTION_FEATURES, hasReachedContactLimit, hasReachedEventLimit } from './subscription'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Check if user can create more contacts (server-side)
export async function canCreateContact(): Promise<{ allowed: boolean; currentCount: number; maxAllowed: number; tier: SubscriptionTier; limitInfo: any }> {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      throw new Error('Unauthorized')
    }

    // Get user's subscription tier
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier, status')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single()

    const tier = (subscription?.tier as SubscriptionTier) || 'free'
    
    // Get current contact count
    const { count: currentCount, error: countError } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    if (countError) {
      throw new Error('Failed to count contacts')
    }

    const maxAllowed = SUBSCRIPTION_FEATURES[tier]?.maxContacts || SUBSCRIPTION_FEATURES.free.maxContacts
    const allowed = !hasReachedContactLimit(tier, currentCount || 0)

    return {
      allowed,
      currentCount: currentCount || 0,
      maxAllowed,
      tier,
      limitInfo: {
        current: currentCount || 0,
        max: maxAllowed === -1 ? 'Unlimited' : maxAllowed,
        remaining: maxAllowed === -1 ? 'Unlimited' : Math.max(0, maxAllowed - (currentCount || 0)),
        percentage: maxAllowed === -1 ? 0 : Math.min(100, ((currentCount || 0) / maxAllowed) * 100),
        isUnlimited: maxAllowed === -1
      }
    }
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

// Check if user can create more events (server-side)
export async function canCreateEvent(): Promise<{ allowed: boolean; currentCount: number; maxAllowed: number; tier: SubscriptionTier; limitInfo: any }> {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      throw new Error('Unauthorized')
    }

    // Get user's subscription tier
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier, status')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single()

    const tier = (subscription?.tier as SubscriptionTier) || 'free'
    
    // Get current event count
    const { count: currentCount, error: countError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    if (countError) {
      throw new Error('Failed to count events')
    }

    const maxAllowed = SUBSCRIPTION_FEATURES[tier]?.maxEvents || SUBSCRIPTION_FEATURES.free.maxEvents
    const allowed = !hasReachedEventLimit(tier, currentCount || 0)

    return {
      allowed,
      currentCount: currentCount || 0,
      maxAllowed,
      tier,
      limitInfo: {
        current: currentCount || 0,
        max: maxAllowed === -1 ? 'Unlimited' : maxAllowed,
        remaining: maxAllowed === -1 ? 'Unlimited' : Math.max(0, maxAllowed - (currentCount || 0)),
        percentage: maxAllowed === -1 ? 0 : Math.min(100, ((currentCount || 0) / maxAllowed) * 100),
        isUnlimited: maxAllowed === -1
      }
    }
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

// Get limit information for display
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

// Get upgrade recommendation for limits
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