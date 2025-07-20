"use client"

import { useState, useEffect } from 'react'
import { SubscriptionTier, SUBSCRIPTION_FEATURES, canPerformAction, canBuyTokens } from './subscription'

interface SubscriptionInfo {
  tier: SubscriptionTier
  status: 'active' | 'inactive' | 'cancelled' | 'trial'
  features: typeof SUBSCRIPTION_FEATURES[SubscriptionTier]
  totalTokensPurchased: number
  trialDaysRemaining?: number
  current_period_end?: string
}

interface UseSubscriptionReturn {
  subscription: SubscriptionInfo | null
  loading: boolean
  error: string | null
  canUseTelegram: boolean
  canCustomizeTemplates: boolean
  canUseCustomBranding: boolean
  canUseAPI: boolean
  canBuyTokens: boolean
  remainingTokenAllowance: number
  upgrade: (tier: SubscriptionTier) => Promise<any>
  refresh: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/subscription')
      if (!response.ok) {
        throw new Error('Failed to fetch subscription')
      }
      
      const data = await response.json()
      setSubscription(data)
    } catch (err: any) {
      setError(err.message)
      // Set default free tier if fetch fails
      setSubscription({
        tier: 'free',
        status: 'inactive',
        features: SUBSCRIPTION_FEATURES.free,
        totalTokensPurchased: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const upgrade = async (tier: SubscriptionTier) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upgrade subscription')
      }
      
      const data = await response.json()
      setSubscription(data)
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [])

  // Computed properties
  const canUseTelegram = subscription ? canPerformAction(subscription.tier, 'use_telegram') : false
  const canCustomizeTemplates = subscription ? canPerformAction(subscription.tier, 'customize_templates') : false
  const canUseCustomBranding = subscription ? canPerformAction(subscription.tier, 'custom_branding') : false
  const canUseAPI = subscription ? canPerformAction(subscription.tier, 'use_api') : false
  const canBuyTokensValue = subscription ? canBuyTokens(subscription.tier, subscription.totalTokensPurchased) : false
  
  const remainingTokenAllowance = subscription?.tier === 'basic' 
    ? Math.max(0, SUBSCRIPTION_FEATURES.basic.maxTokens - subscription.totalTokensPurchased)
    : -1

  return {
    subscription,
    loading,
    error,
    canUseTelegram,
    canCustomizeTemplates,
    canUseCustomBranding,
    canUseAPI,
    canBuyTokens: canBuyTokensValue,
    remainingTokenAllowance,
    upgrade,
    refresh: fetchSubscription
  }
}

// Hook for checking specific feature access
export function useFeatureAccess(feature: 'use_telegram' | 'customize_templates' | 'custom_branding' | 'use_api' | 'buy_tokens') {
  const { subscription, loading } = useSubscription()
  
  if (loading || !subscription) {
    return { allowed: false, loading: true }
  }
  
  return {
    allowed: canPerformAction(subscription.tier, feature),
    loading: false,
    tier: subscription.tier
  }
}

// Hook for checking limits
export function useLimits() {
  const { subscription, loading } = useSubscription()
  
  if (loading || !subscription) {
    return { 
      contactLimit: { current: 0, max: 0, reached: false },
      eventLimit: { current: 0, max: 0, reached: false },
      loading: true 
    }
  }
  
  const features = subscription.features
  
  return {
    contactLimit: {
      current: 0, // This would need to be fetched separately
      max: features.maxContacts,
      reached: false // This would need to be calculated
    },
    eventLimit: {
      current: 0, // This would need to be fetched separately
      max: features.maxEvents,
      reached: false // This would need to be calculated
    },
    loading: false
  }
} 