import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Zap, Crown, Building } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      icon: Star,
      price: "RM 0",
      period: "/month",
      description: "Perfect for getting started",
      features: [
        "Create and manage events",
        "Up to 20 contacts",
        "10 tokens/month",
        "Email only",
        "Access to reminder system",
        "Basic templates",
      ],
      limitations: ["No SMS/WhatsApp/Telegram", "No premium templates"],
      buttonText: "Start Free",
      buttonVariant: "outline" as const,
      popular: false,
    },
    {
      name: "Basic",
      icon: Zap,
      price: "RM 15",
      period: "/month",
      description: "Great for personal events",
      features: [
        "Up to 100 contacts",
        "100 tokens/month",
        "Email + WhatsApp",
        "Schedule reminders & recurring events",
        "Message templates",
        "Priority email support",
      ],
      buttonText: "Subscribe Now",
      buttonVariant: "default" as const,
      popular: true,
    },
    {
      name: "Premium",
      icon: Crown,
      price: "RM 40",
      period: "/month",
      description: "Perfect for frequent organizers",
      features: [
        "Up to 500 contacts",
        "300 tokens/month",
        "Email + WhatsApp + Telegram",
        "Full access to message templates",
        "Custom reminder milestones",
        "Analytics (opens, clicks)",
        "Support within 24 hours",
      ],
      buttonText: "Subscribe Now",
      buttonVariant: "default" as const,
      popular: false,
    },
    {
      name: "Business",
      icon: Building,
      price: "RM 99",
      period: "/month",
      description: "For professional event planners",
      features: [
        "Unlimited contacts",
        "1,000 tokens/month",
        "Email + WhatsApp + Telegram + SMS",
        "Custom branding on invites",
        "Priority support + phone callback",
        "Message delivery SLA",
        "Advanced analytics",
      ],
      buttonText: "Subscribe Now",
      buttonVariant: "default" as const,
      popular: false,
    },
  ]

  const tokenPacks = [
    { tokens: 50, price: "RM 5" },
    { tokens: 120, price: "RM 10", popular: true },
    { tokens: 300, price: "RM 20" },
  ]

  return (
    <div className="bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start free and upgrade as your celebration needs grow. All plans include our core event management features.
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan) => {
            const IconComponent = plan.icon
            return (
              <Card
                key={plan.name}
                className={`relative ${plan.popular ? "border-orange-300 shadow-lg scale-105" : "border-gray-200"}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-rose-500">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${plan.popular ? "bg-orange-100" : "bg-gray-100"}`}>
                      <IconComponent className={`h-6 w-6 ${plan.popular ? "text-orange-500" : "text-gray-600"}`} />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {plan.price}
                    <span className="text-sm font-normal text-gray-500">{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations?.map((limitation, index) => (
                      <li key={index} className="flex items-start text-gray-400">
                        <span className="text-sm">• {limitation}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className="block">
                    <Button
                      className={`w-full ${plan.popular ? "bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600" : ""}`}
                      variant={plan.buttonVariant}
                    >
                      {plan.buttonText}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Token Packs */}
        <div className="bg-white rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Need More Tokens?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {tokenPacks.map((pack, index) => (
              <Card
                key={index}
                className={`text-center relative ${pack.popular ? "border-orange-300 shadow-lg" : "border-gray-200"}`}
              >
                {pack.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-rose-500">
                    Best Value
                  </Badge>
                )}
                <CardContent className="p-6">
                  <div className="text-2xl font-bold mb-2">{pack.tokens} Tokens</div>
                  <div className="text-3xl font-bold text-orange-500 mb-4">{pack.price}</div>
                  <Button className={`w-full ${pack.popular ? "bg-gradient-to-r from-orange-500 to-rose-500" : ""}`}>
                    Buy Tokens
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center text-gray-600">
            <h3 className="font-semibold mb-2">Token Usage:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div>Email: 0.5 tokens</div>
              <div>WhatsApp: 1 token</div>
              <div>Telegram: 1 token</div>
              <div>SMS: 2 tokens</div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Questions?</h2>
          <p className="text-gray-600 mb-6">
            Our support team is here to help you choose the right plan for your needs.
          </p>
          <Link href="/contact">
            <Button variant="outline" size="lg">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
