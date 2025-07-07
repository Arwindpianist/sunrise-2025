"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Check, Coins, Zap, Crown, Building } from "lucide-react"
import { SUBSCRIPTION_PLANS, TOKEN_TOPUPS, calculateTokenPackPrice } from "@/lib/pricing"

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

  useEffect(() => {
    setMounted(true)
    if (user) {
      fetchUserTier()
    }
  }, [user])

  const fetchUserTier = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('subscription_plan')
        .eq('id', user?.id)
        .single()

      if (!error && data) {
        setUserTier(data.subscription_plan || "free")
      }
    } catch (error) {
      console.error('Error fetching user tier:', error)
    }
  }

  const handleGetStarted = (plan: string) => {
    if (user) {
      router.push('/dashboard/balance')
    } else {
      router.push('/register')
    }
  }

  const handleBuyTokens = () => {
    router.push('/dashboard/balance')
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
            Smart Pricing That Grows With You
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
            Subscribe to unlock discounted token prices and advanced features. Pay only for what you use with our flexible token system.
          </p>
        </div>

        {/* Trial Tokens Banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-6 mb-8 text-center">
          <h2 className="text-xl font-bold mb-2">🎁 New Users Get 15 Free Tokens!</h2>
          <p className="text-green-100">
            Start sending emails immediately. No credit card required for your first 15 messages.
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Subscription Plans</h2>
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            {SUBSCRIPTION_PLANS_WITH_ICONS.map((plan) => {
              const IconComponent = plan.icon
              return (
                <Card
                  key={plan.name}
                  className={`relative ${
                    plan.popular
                      ? "border-2 border-orange-500 shadow-lg scale-105"
                      : "border border-gray-200"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs sm:text-sm px-3 sm:px-4 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader className="px-4 sm:px-6">
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
                  <CardContent className="px-4 sm:px-6">
                    <div className="mb-4 sm:mb-6">
                      <span className="text-3xl sm:text-4xl font-bold text-gray-800">
                        RM{plan.price}
                      </span>
                      <span className="text-gray-600 text-sm sm:text-base">/month</span>
                    </div>
                    <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm font-medium text-orange-800">
                        Token Price: RM{plan.tokenPrice} (Save {plan.discount})
                      </p>
                    </div>
                    <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center text-gray-600 text-sm sm:text-base">
                          <Check className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 mr-2 flex-shrink-0" />
                          <span className="leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full h-11 sm:h-12 text-sm sm:text-base font-medium ${
                        plan.popular
                          ? "bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                          : "bg-gray-800 hover:bg-gray-900"
                      }`}
                      onClick={() => handleGetStarted(plan.name)}
                    >
                      {user ? "Upgrade Now" : "Get Started"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Token Pricing Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Token Pricing</h2>
          <div className="bg-white rounded-lg p-6 mb-8">
            <div className="grid gap-4 md:grid-cols-4 text-center">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600">No Plan</p>
                <p className="text-2xl font-bold text-gray-800">RM0.50</p>
                <p className="text-xs text-gray-500">per token</p>
              </div>
              <div className="p-4 border rounded-lg bg-orange-50">
                <p className="text-sm text-gray-600">Basic</p>
                <p className="text-2xl font-bold text-orange-600">RM0.45</p>
                <p className="text-xs text-gray-500">Save 10%</p>
              </div>
              <div className="p-4 border rounded-lg bg-orange-100">
                <p className="text-sm text-gray-600">Pro</p>
                <p className="text-2xl font-bold text-orange-700">RM0.40</p>
                <p className="text-xs text-gray-500">Save 20%</p>
              </div>
              <div className="p-4 border rounded-lg bg-orange-200">
                <p className="text-sm text-gray-600">Enterprise</p>
                <p className="text-2xl font-bold text-orange-800">RM0.35</p>
                <p className="text-xs text-gray-500">Save 30%</p>
              </div>
            </div>
          </div>

          {/* Token Packs */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            {TOKEN_TOPUPS.map((pack) => (
              <Card
                key={pack.name}
                className={`relative bg-white/50 backdrop-blur-sm hover:shadow-lg transition-shadow ${
                  pack.popular ? "border-2 border-orange-500" : ""
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                      Popular
                    </span>
                  </div>
                )}
                <CardContent className="pt-6 text-center">
                  <h3 className="font-bold text-lg mb-1">{pack.name}</h3>
                  <p className="text-2xl font-bold text-orange-500 mb-1">{pack.tokens}</p>
                  <p className="text-sm text-gray-600 mb-2">tokens</p>
                  <p className="text-sm text-gray-500 mb-4">{pack.description}</p>
                  
                  {/* Price examples for different tiers */}
                  <div className="space-y-1 text-xs">
                    <p className="text-gray-600">Free: RM{(pack.tokens * 0.50).toFixed(2)}</p>
                    <p className="text-orange-600">Pro: RM{(pack.tokens * 0.40).toFixed(2)}</p>
                  </div>
                  
                  <Button 
                    className="w-full mt-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
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
        <div className="bg-white rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">How It Works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Start Free</h3>
              <p className="text-gray-600 text-sm">Get 15 free tokens when you sign up. No credit card required.</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">Subscribe & Save</h3>
              <p className="text-gray-600 text-sm">Choose a plan to unlock discounted token prices and advanced features.</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Pay Per Use</h3>
              <p className="text-gray-600 text-sm">Buy tokens as needed. Only pay for the messages you actually send.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
            Join thousands of users who trust Sunrise for their event management needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 h-11 sm:h-12"
              onClick={() => router.push('/register')}
            >
              Start Free Trial
            </Button>
            <Button
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-50 h-11 sm:h-12"
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
