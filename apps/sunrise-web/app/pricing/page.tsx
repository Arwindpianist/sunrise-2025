"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Coins, Zap, Crown } from "lucide-react"
import { SUBSCRIPTION_PLANS, TOKEN_TOPUPS, getTokenPriceDisplay, CHANNEL_TOKEN_BURN } from "@/lib/pricing"
import { getPlanChangeInfo, isPlanUpgrade } from "@/lib/billing-utils"
import { toast } from "@/components/ui/use-toast"
import PricingRedesign from "@/components/public/pricing-redesign"

// Add icons to subscription plans
const SUBSCRIPTION_PLANS_WITH_ICONS = SUBSCRIPTION_PLANS.map((plan) => {
  const iconMap: Record<string, any> = { Coins, Zap, Crown };
  return {
    ...plan,
    icon: iconMap[plan.icon] || Coins,
  };
});

export default function PricingPage() {
  const router = useRouter()
  const { user, supabase } = useSupabase()
  const [mounted, setMounted] = useState(false)
  const [userTier, setUserTier] = useState<string>("free")
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (user) {
      fetchUserTier()
    }
  }, [user])

  const fetchUserTier = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('tier, status, current_period_start, current_period_end')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!error && data) {
        setUserTier(data.tier || "free")
        setCurrentSubscription(data)
      } else {
        setUserTier("free")
        setCurrentSubscription(null)
      }
    } catch (error) {
      console.error('Error fetching user tier:', error)
      setUserTier("free")
      setCurrentSubscription(null)
    }
  }

  const handleGetStarted = async (plan: string) => {
    if (!user) {
      router.push('/register')
      return
    }

    setLoading(true)

    try {
      const planTier = plan.toLowerCase()
      
      // Check if this is an upgrade
      if (currentSubscription && isPlanUpgrade(userTier as any, planTier as any)) {
        // For upgrades, we need to ensure proper Stripe verification
        // Create a checkout session for the upgrade instead of direct database update
        const response = await fetch('/api/subscription/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tier: planTier }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create upgrade checkout session')
        }

        const { url } = await response.json()
        
        // Redirect to Stripe checkout for upgrade
        if (url) {
          window.location.href = url
        }
        return
      }

      // Create new subscription
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier: planTier }),
      })

      if (!response.ok) {
        throw new Error('Failed to create subscription')
      }

      const { url } = await response.json()
      
      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url
      }
    } catch (error: any) {
      console.error('Error creating subscription:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to process subscription",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBuyTokens = () => {
    router.push('/dashboard/balance')
  }

  const getProrationInfo = (planTier: string) => {
    if (!currentSubscription || !isPlanUpgrade(userTier as any, planTier as any)) {
      return null
    }

    try {
      const planChangeInfo = getPlanChangeInfo(
        userTier as any,
        planTier as any,
        currentSubscription.current_period_start,
        currentSubscription.current_period_end
      )
      return planChangeInfo
    } catch (error) {
      console.error('Error calculating proration:', error)
      return null
    }
  }

  const getButtonText = (plan: string) => {
    if (!user) return "Get Started"
    if (userTier === plan.toLowerCase()) return "Current Plan"
    if (isPlanUpgrade(userTier as any, plan.toLowerCase() as any)) return "Upgrade"
    return "Change Plan"
  }

  if (!mounted) {
    return null
  }

  return (
    <PricingRedesign
      plans={SUBSCRIPTION_PLANS_WITH_ICONS as any}
      packs={TOKEN_TOPUPS as any}
      userTier={userTier}
      loading={loading}
      getButtonText={getButtonText}
      getTokenPriceDisplay={getTokenPriceDisplay}
      getProrationInfo={getProrationInfo}
      onSelectPlan={handleGetStarted}
      onBuyTokens={handleBuyTokens}
      channelBurns={CHANNEL_TOKEN_BURN}
    />
  )
}
