"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Check, X, Star, Zap, Crown, Users, MessageSquare, Calendar, Palette, Code, Shield } from "lucide-react"
import Link from "next/link"

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqData: FAQItem[] = [
  // Pricing & Plans
  {
    question: "What are the different subscription tiers and their prices?",
    answer: "We offer 4 flexible tiers: Free (RM0/month), Basic (RM9.90/month), Pro (RM29.90/month), and Enterprise (RM79.90/month). Each tier is designed to grow with your needs.",
    category: "pricing"
  },
  {
    question: "What's included in the Free tier?",
    answer: "Free tier includes: 15 trial tokens, generic email templates, core event management features, and mobile-friendly interface. Perfect for trying out Sunrise.",
    category: "pricing"
  },
  {
    question: "Why should I upgrade from Free to a paid tier?",
    answer: "Paid tiers unlock: discounted token pricing (10-30% savings), Telegram messaging (Pro+), custom branding (Pro+), API access (Enterprise), priority support, and unlimited tokens (Pro+).",
    category: "pricing"
  },
  {
    question: "Do you offer annual billing with discounts?",
    answer: "Currently we offer monthly billing with no long-term contracts. You can upgrade or downgrade anytime with no penalties.",
    category: "pricing"
  },
  // Limits & Usage
  {
    question: "How does the token system work?",
    answer: "Tokens are used to send messages. Free users get 15 trial tokens. Basic users get 100 lifetime tokens included, Pro users get unlimited tokens, and Enterprise users get unlimited everything. Token prices: Free RM0.50, Basic RM0.45 (10% off), Pro RM0.40 (20% off), Enterprise RM0.35 (30% off).",
    category: "limits"
  },
  {
    question: "What are the token packages available?",
    answer: "We offer 4 token packages: Starter Pack (25 tokens), Popular Pack (75 tokens), Business Pack (150 tokens), and Enterprise Pack (500 tokens). Subscription tiers get discounted rates on all packages.",
    category: "limits"
  },
  {
    question: "Can I buy additional tokens?",
    answer: "Yes! All paid tiers can purchase additional tokens at discounted rates. Free users cannot buy tokens - they need to upgrade to Basic or higher to purchase tokens.",
    category: "limits"
  },
  // Features & Customization
  {
    question: "Which tiers support custom branding and templates?",
    answer: "Pro and Enterprise tiers include full custom branding: your logo, colors, fonts, and custom email templates. Basic tier includes all email templates but no custom branding.",
    category: "features"
  },
  {
    question: "Do you offer API access?",
    answer: "API access is available on Enterprise tier only. This allows integration with your existing systems and white-label options.",
    category: "features"
  },
  {
    question: "What messaging channels are supported?",
    answer: "All tiers support email messaging. Telegram messaging is available on Pro and Enterprise tiers only.",
    category: "features"
  },
  // Subscription & Billing
  {
    question: "What's your cancellation policy?",
    answer: "You can cancel anytime with no penalties. Your service continues until the end of your current billing period.",
    category: "billing"
  },
  {
    question: "Do you offer refunds?",
    answer: "We do not offer refunds. All purchases are final. Please review our features and pricing carefully before subscribing.",
    category: "billing"
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, debit cards, and online banking transfers through secure Stripe processing.",
    category: "billing"
  },
  // Support & Service
  {
    question: "What kind of support do you offer?",
    answer: "Free and Basic: Email support. Pro: Priority support. Enterprise: Dedicated account manager and priority support.",
    category: "support"
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely! We use enterprise-grade security: SSL encryption, GDPR compliance, regular backups, and secure data centers.",
    category: "support"
  },
  {
    question: "What happens when I run out of tokens?",
    answer: "Free users cannot buy more tokens and need to upgrade. Basic users can buy more tokens until they reach their 100 token lifetime limit, then need to upgrade to Pro for unlimited tokens. Pro and Enterprise users can buy unlimited tokens.",
    category: "support"
  }
]

const categories = [
  { id: "pricing", name: "Pricing & Plans", icon: Star },
  { id: "limits", name: "Limits & Usage", icon: Zap },
  { id: "features", name: "Features & Customization", icon: Crown },
  { id: "billing", name: "Subscription & Billing", icon: Shield },
  { id: "support", name: "Support & Service", icon: Users }
]

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("pricing")
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggleItem = (question: string) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(question)) {
      newOpenItems.delete(question)
    } else {
      newOpenItems.add(question)
    }
    setOpenItems(newOpenItems)
  }

  const filteredFAQs = faqData.filter(faq => faq.category === activeCategory)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to know about Sunrise pricing, features, and policies.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Category Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                onClick={() => setActiveCategory(category.id)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {category.name}
              </Button>
            )
          })}
        </div>

        {/* FAQ Content */}
        <div className="max-w-4xl mx-auto space-y-6">
          {filteredFAQs.map((faq, index) => (
            <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader 
                className="cursor-pointer pb-4"
                onClick={() => toggleItem(faq.question)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    {faq.question}
                  </CardTitle>
                  {openItems.has(faq.question) ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </CardHeader>
              {openItems.has(faq.question) && (
                <CardContent className="pt-0">
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Pricing Comparison */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Compare Our Plans
            </h2>
            <p className="text-xl text-gray-600">
              Choose the perfect plan for your event management needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free Tier */}
            <Card className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Free</CardTitle>
                <div className="text-3xl font-bold text-gray-800">RM0</div>
                <div className="text-gray-600">per month</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">15 trial tokens</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Generic email templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Core event management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Mobile-friendly interface</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-500">Token purchasing</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-500">Telegram messaging</span>
                </div>
              </CardContent>
            </Card>

            {/* Basic Tier */}
            <Card className="relative border-2 border-orange-200">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-orange-500 text-white">Popular</Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Basic</CardTitle>
                <div className="text-3xl font-bold text-gray-800">RM9.90</div>
                <div className="text-gray-600">per month</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">100 lifetime tokens included</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Discounted token pricing (10% off)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">All email templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Smart contact management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Event scheduling & tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-500">Telegram messaging</span>
                </div>
              </CardContent>
            </Card>

            {/* Pro Tier */}
            <Card className="relative border-2 border-rose-200">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-rose-500 text-white">Best Value</Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Pro</CardTitle>
                <div className="text-3xl font-bold text-gray-800">RM29.90</div>
                <div className="text-gray-600">per month</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Unlimited tokens</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Discounted token pricing (20% off)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Telegram messaging</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Custom branding</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Priority support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Bulk contact import</span>
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Tier */}
            <Card className="relative border-2 border-purple-200">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-500 text-white">Enterprise</Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Enterprise</CardTitle>
                <div className="text-3xl font-bold text-gray-800">RM79.90</div>
                <div className="text-gray-600">per month</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Unlimited everything</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Discounted token pricing (30% off)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">API access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Dedicated account manager</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">White-label options</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Priority support</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-orange-500 to-rose-500 text-white">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Transform Your Event Management?
              </h2>
              <p className="text-xl mb-6 opacity-90">
                Join thousands of event organizers who've upgraded from free to paid plans. 
                Start with Basic at RM9.90/month and scale as you grow.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/pricing">
                  <Button size="lg" variant="secondary" className="bg-white text-orange-500 hover:bg-gray-100">
                    View All Plans
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" className="bg-white text-orange-500 hover:bg-gray-100 border-white">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 