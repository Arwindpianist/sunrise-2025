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
  userBalance: number
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
  const [userBalance, setUserBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch subscription data
      const response = await fetch('/api/subscription')
      if (!response.ok) {
        throw new Error('Failed to fetch subscription')
      }
      
      const data = await response.json()
      
      // Validate the data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid subscription data received')
      }
      
      // Ensure all required fields are present
      const validatedData = {
        tier: data.tier || 'free',
        status: data.status || 'inactive',
        features: data.features || SUBSCRIPTION_FEATURES.free,
        totalTokensPurchased: data.totalTokensPurchased || 0,
        trialDaysRemaining: data.trialDaysRemaining,
        current_period_end: data.current_period_end
      }
      
      setSubscription(validatedData)

      // Fetch user balance
      try {
        const balanceResponse = await fetch('/api/user/balance')
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json()
          setUserBalance(balanceData.balance || 0)
        }
      } catch (balanceError) {
        console.error('Error fetching user balance:', balanceError)
        setUserBalance(0)
      }
    } catch (err: any) {
      console.error('Error fetching subscription:', err)
      setError(err.message)
      // Set default free tier if fetch fails
      setSubscription({
        tier: 'free',
        status: 'inactive',
        features: SUBSCRIPTION_FEATURES.free,
        totalTokensPurchased: 0
      })
      setUserBalance(0)
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

  // Computed properties - only compute if subscription is loaded and not null
  const canUseTelegram = subscription && !loading && subscription.tier ? canPerformAction(subscription.tier, 'use_telegram') : false
  const canCustomizeTemplates = subscription && !loading && subscription.tier ? canPerformAction(subscription.tier, 'customize_templates') : false
  const canUseCustomBranding = subscription && !loading && subscription.tier ? canPerformAction(subscription.tier, 'custom_branding') : false
  const canUseAPI = subscription && !loading && subscription.tier ? canPerformAction(subscription.tier, 'use_api') : false
  const canBuyTokensValue = subscription && !loading && subscription.tier ? canBuyTokens(subscription.tier, subscription.totalTokensPurchased || 0) : false
  
  const remainingTokenAllowance = subscription?.tier === 'basic' && !loading && subscription?.totalTokensPurchased !== undefined
    ? Math.max(0, SUBSCRIPTION_FEATURES.basic.maxTokens - subscription.totalTokensPurchased)
    : -1

  return {
    subscription,
    loading,
    error,
    userBalance,
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
  
  const features = subscription.features || SUBSCRIPTION_FEATURES.free
  
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