"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Check } from "lucide-react"

const PRICING_PLANS = [
  {
    name: "Basic",
    description: "Perfect for small events",
    price: 9.90,
    features: [
      "100 email credits",
      "Basic email templates",
      "Smart contact management",
      "Event scheduling",
      "Email tracking",
    ],
    popular: false,
  },
  {
    name: "Pro",
    description: "Best for growing businesses",
    price: 49.90,
    features: [
      "500 email credits",
      "Advanced email templates",
      "Smart contact management",
      "Event scheduling",
      "Email tracking",
      "Priority support",
      "Custom branding",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For large-scale events",
    price: 99.90,
    features: [
      "1000 email credits",
      "Premium email templates",
      "Smart contact management",
      "Event scheduling",
      "Email tracking",
      "Priority support",
      "Custom branding",
      "API access",
      "Dedicated account manager",
    ],
    popular: false,
  },
]

export default function PricingPage() {
  const router = useRouter()
  const { user } = useSupabase()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleGetStarted = (plan: string) => {
    if (user) {
      router.push('/dashboard/balance')
    } else {
      router.push('/register')
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your event management needs. All plans include our core features.
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
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
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800">
                  {plan.name}
                </CardTitle>
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
          ))}
        </div>

        <div className="mt-12 sm:mt-16 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
            Need a custom plan?
          </h2>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
            Contact us for custom pricing and features tailored to your needs.
          </p>
          <Button
            variant="outline"
            className="border-orange-500 text-orange-500 hover:bg-orange-50 w-full sm:w-auto h-11 sm:h-12"
            onClick={() => router.push('/contact')}
          >
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  )
}
