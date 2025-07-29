"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Check, Coins, Zap, Crown, Building, Info } from "lucide-react"
import { SUBSCRIPTION_PLANS, TOKEN_TOPUPS, calculateTokenPackPrice, getTokenPriceDisplay } from "@/lib/pricing"
import { getPlanChangeInfo, isPlanUpgrade, formatProrationInfo } from "@/lib/billing-utils"
import { toast } from "@/components/ui/use-toast"

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
        // Handle upgrade with proration
        const response = await fetch('/api/subscription/upgrade', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tier: planTier }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to upgrade subscription')
        }

        const result = await response.json()
        
        // Show success message with proration info
        toast({
          title: "Upgrade Successful!",
          description: `Your plan has been upgraded to ${plan}. ${result.planChangeInfo.prorationInfo}`,
        })

        // Refresh user data
        await fetchUserTier()
        setLoading(false)
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-6 sm:px-8 py-16 sm:py-20">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-800 mb-4 sm:mb-6">
            Token-Based Pricing That Scales With You
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Subscribe to unlock better token rates and advanced features. Pay only for the messages you send with our flexible token system.
          </p>
        </div>

        {/* Trial Tokens Banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-8 mb-12 text-center shadow-lg">
          <h2 className="text-2xl font-bold mb-3">🎁 New Users Get 15 Free Tokens!</h2>
          <p className="text-green-100 text-lg">
            Start sending messages immediately. No credit card required for your first 15 tokens.
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-10 text-center">Subscription Plans</h2>
          <div className="grid gap-8 lg:gap-10 lg:grid-cols-3">
            {SUBSCRIPTION_PLANS_WITH_ICONS.map((plan) => {
              const IconComponent = plan.icon
              return (
                <Card
                  key={plan.name}
                  className={`relative ${
                    plan.popular
                      ? "border-2 border-orange-500 shadow-xl scale-105"
                      : "border border-gray-200 shadow-lg hover:shadow-xl transition-shadow"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm px-5 py-2 rounded-full font-medium shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader className="px-6 sm:px-8 pt-8 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <IconComponent className="h-6 w-6 text-orange-500" />
                      <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800">
                        {plan.name}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-gray-600 text-sm sm:text-base">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 sm:px-8 pb-8">
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-800">
                        RM{plan.price}
                      </span>
                      <span className="text-gray-600 text-lg">/month</span>
                    </div>
                    <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-sm font-medium text-orange-800">
                        Token Rate: {getTokenPriceDisplay(plan.name.toLowerCase())} (Save {plan.discount})
                      </p>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center text-gray-600 text-sm sm:text-base">
                          <Check className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 mr-2 flex-shrink-0" />
                          <span className="leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {(() => {
                      const planTier = plan.name.toLowerCase()
                      const prorationInfo = getProrationInfo(planTier)
                      const buttonText = getButtonText(plan.name)
                      const isCurrentPlan = userTier === planTier
                      const isUpgrade = isPlanUpgrade(userTier as any, planTier as any)
                      
                      return (
                        <div className="space-y-3">
                          {prorationInfo && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                  <p className="font-medium text-blue-800">Prorated Upgrade</p>
                                  <p className="text-blue-700">{formatProrationInfo(prorationInfo.prorationInfo)}</p>
                                  <p className="text-blue-700 font-medium">
                                    +{prorationInfo.prorationInfo.proratedTokens} tokens for remaining period
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <Button
                            className={`w-full h-12 text-base font-medium ${
                              isCurrentPlan
                                ? "bg-gray-400 cursor-not-allowed"
                                : plan.popular
                                ? "bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                                : "bg-gray-800 hover:bg-gray-900"
                            }`}
                            onClick={() => !isCurrentPlan && handleGetStarted(plan.name)}
                            disabled={isCurrentPlan || loading}
                          >
                            {loading ? "Processing..." : buttonText}
                          </Button>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Token Rates Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Token Rates by Plan</h2>
          <div className="bg-white rounded-xl p-8 mb-10 shadow-lg">
            <div className="grid gap-6 md:grid-cols-4 text-center">
              <div className="p-6 border rounded-xl hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600 mb-2">Free</p>
                <p className="text-2xl font-bold text-gray-800 mb-1">Standard</p>
                <p className="text-xs text-gray-500">No discount</p>
              </div>
              <div className="p-6 border rounded-xl bg-orange-50 hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600 mb-2">Basic</p>
                <p className="text-2xl font-bold text-orange-600 mb-1">Good Value</p>
                <p className="text-xs text-gray-500">Save 10%</p>
              </div>
              <div className="p-6 border rounded-xl bg-orange-100 hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600 mb-2">Pro</p>
                <p className="text-2xl font-bold text-orange-700 mb-1">Great Value</p>
                <p className="text-xs text-gray-500">Save 20%</p>
              </div>
              <div className="p-6 border rounded-xl bg-orange-200 hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600 mb-2">Enterprise</p>
                <p className="text-2xl font-bold text-orange-800 mb-1">Best Value</p>
                <p className="text-xs text-gray-500">Save 30%</p>
              </div>
            </div>
          </div>

          {/* Token Packs */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            {TOKEN_TOPUPS.map((pack) => (
                              <Card
                  key={pack.name}
                  className={`relative bg-white/50 backdrop-blur-sm hover:shadow-xl transition-shadow ${
                    pack.popular ? "border-2 border-orange-500 shadow-lg" : ""
                  }`}
                >
                  {pack.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-orange-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                        Popular
                      </span>
                    </div>
                  )}
                  <CardContent className="pt-8 pb-6 text-center">
                  <h3 className="font-bold text-lg mb-1">{pack.name}</h3>
                  <p className="text-2xl font-bold text-orange-500 mb-1">{pack.tokens}</p>
                  <p className="text-sm text-gray-600 mb-2">tokens</p>
                  <p className="text-sm text-gray-500 mb-4">{pack.description}</p>
                  
                  {/* Token pack info */}
                  <div className="space-y-1 text-xs">
                    <p className="text-gray-600">Perfect for {pack.description.toLowerCase()}</p>
                    <p className="text-orange-600">Better rates with subscription</p>
                  </div>
                  
                  <Button 
                    className="w-full mt-6 h-11 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                    onClick={handleBuyTokens}
                  >
                    Buy Tokens
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl p-10 mb-12 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-orange-600 font-bold text-xl">1</span>
              </div>
              <h3 className="font-semibold mb-3 text-lg">Start Free</h3>
              <p className="text-gray-600">Get 15 free tokens when you sign up. No credit card required.</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-orange-600 font-bold text-xl">2</span>
              </div>
              <h3 className="font-semibold mb-3 text-lg">Subscribe & Save</h3>
              <p className="text-gray-600">Choose a plan to unlock better token rates and advanced features.</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-orange-600 font-bold text-xl">3</span>
              </div>
              <h3 className="font-semibold mb-3 text-lg">Pay Per Use</h3>
              <p className="text-gray-600">Buy tokens as needed. Only pay for the messages you actually send.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">
            Ready to get started?
          </h2>
          <p className="text-gray-600 mb-6 sm:mb-8 text-lg">
            Join thousands of users who trust Sunrise for their event management needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 h-12 text-lg font-medium"
              onClick={() => router.push('/register')}
            >
              Start Free Trial
            </Button>
            <Button
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-50 h-12 text-lg font-medium"
              onClick={() => router.push('/contact')}
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
