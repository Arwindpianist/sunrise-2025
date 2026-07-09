"use client"

export {
  SubscriptionProvider,
  useSubscription,
  type SubscriptionContextValue,
} from "@/components/providers/subscription-provider"

import { useSubscription } from "@/components/providers/subscription-provider"
import { SUBSCRIPTION_FEATURES, canPerformAction } from "./subscription"
import type { SubscriptionTier } from "./subscription"

export function useFeatureAccess(
  feature:
    | "use_telegram"
    | "customize_templates"
    | "custom_branding"
    | "use_api"
    | "buy_tokens"
) {
  const { subscription, loading } = useSubscription()

  if (loading || !subscription) {
    return { allowed: false, loading: true }
  }

  return {
    allowed: canPerformAction(subscription.tier, feature),
    loading: false,
    tier: subscription.tier,
  }
}

export function useLimits() {
  const { subscription, loading } = useSubscription()

  if (loading || !subscription) {
    return {
      contactLimit: { current: 0, max: 0, reached: false },
      eventLimit: { current: 0, max: 0, reached: false },
      loading: true,
    }
  }

  const features = subscription.features || SUBSCRIPTION_FEATURES.free

  return {
    contactLimit: {
      current: 0,
      max: features.maxContacts,
      reached: false,
    },
    eventLimit: {
      current: 0,
      max: features.maxEvents,
      reached: false,
    },
    loading: false,
  }
}

export type { SubscriptionTier } from "./subscription"
