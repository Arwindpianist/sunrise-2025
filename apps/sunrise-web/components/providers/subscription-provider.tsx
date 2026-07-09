"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  SubscriptionTier,
  SUBSCRIPTION_FEATURES,
  canPerformAction,
  canBuyTokens,
} from "@/lib/subscription"

interface SubscriptionInfo {
  tier: SubscriptionTier
  status: "active" | "inactive" | "cancelled" | "trial"
  features: (typeof SUBSCRIPTION_FEATURES)[SubscriptionTier]
  totalTokensPurchased: number
  trialDaysRemaining?: number
  current_period_end?: string
}

export interface SubscriptionContextValue {
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
  upgrade: (tier: SubscriptionTier) => Promise<unknown>
  refresh: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [userBalance, setUserBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/subscription")
      if (!response.ok) {
        throw new Error("Failed to fetch subscription")
      }

      const data = await response.json()

      if (!data || typeof data !== "object") {
        throw new Error("Invalid subscription data received")
      }

      const validatedData: SubscriptionInfo = {
        tier: data.tier || "free",
        status: data.status || "inactive",
        features: data.features || SUBSCRIPTION_FEATURES.free,
        totalTokensPurchased: data.totalTokensPurchased || 0,
        trialDaysRemaining: data.trialDaysRemaining,
        current_period_end: data.current_period_end,
      }

      setSubscription(validatedData)

      try {
        const balanceResponse = await fetch("/api/user/balance")
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json()
          setUserBalance(balanceData.balance || 0)
        }
      } catch (balanceError) {
        console.error("Error fetching user balance:", balanceError)
        setUserBalance(0)
      }
    } catch (err: unknown) {
      console.error("Error fetching subscription:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
      setSubscription({
        tier: "free",
        status: "inactive",
        features: SUBSCRIPTION_FEATURES.free,
        totalTokensPurchased: 0,
      })
      setUserBalance(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const upgrade = useCallback(async (tier: SubscriptionTier) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upgrade subscription")
      }

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
        return data
      }

      setSubscription(data)
      return data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upgrade failed"
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const canUseTelegram =
    subscription && !loading && subscription.tier
      ? canPerformAction(subscription.tier, "use_telegram")
      : false
  const canCustomizeTemplates =
    subscription && !loading && subscription.tier
      ? canPerformAction(subscription.tier, "customize_templates")
      : false
  const canUseCustomBranding =
    subscription && !loading && subscription.tier
      ? canPerformAction(subscription.tier, "custom_branding")
      : false
  const canUseAPI =
    subscription && !loading && subscription.tier
      ? canPerformAction(subscription.tier, "use_api")
      : false
  const canBuyTokensValue =
    subscription && !loading && subscription.tier
      ? canBuyTokens(subscription.tier, subscription.totalTokensPurchased || 0)
      : false

  const remainingTokenAllowance =
    subscription?.tier === "basic" && !loading && subscription?.totalTokensPurchased !== undefined
      ? Math.max(0, SUBSCRIPTION_FEATURES.basic.maxTokens - subscription.totalTokensPurchased)
      : -1

  const value = useMemo<SubscriptionContextValue>(
    () => ({
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
      refresh: fetchSubscription,
    }),
    [
      subscription,
      loading,
      error,
      userBalance,
      canUseTelegram,
      canCustomizeTemplates,
      canUseCustomBranding,
      canUseAPI,
      canBuyTokensValue,
      remainingTokenAllowance,
      upgrade,
      fetchSubscription,
    ]
  )

  return (
    <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
  )
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider")
  }
  return ctx
}
