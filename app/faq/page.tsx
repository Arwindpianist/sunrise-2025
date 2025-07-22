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
    answer: "We offer 4 flexible tiers: Free (RM0/month), Basic (RM29/month), Pro (RM79/month), and Enterprise (RM199/month). Each tier is designed to grow with your needs.",
    category: "pricing"
  },
  {
    question: "What's included in the Free tier?",
    answer: "Free tier includes: 5 events per month, 50 contacts, 100 messages per month, basic email templates, and core event management features.",
    category: "pricing"
  },
  {
    question: "Why should I upgrade from Free to a paid tier?",
    answer: "Paid tiers unlock: unlimited events, unlimited contacts, priority support, custom branding, advanced templates, API access, and much higher message limits.",
    category: "pricing"
  },
  {
    question: "Do you offer annual billing with discounts?",
    answer: "Yes! Save 20% with annual billing: Basic (RM279/year), Pro (RM759/year), Enterprise (RM1,909/year).",
    category: "pricing"
  },
  // Limits & Usage
  {
    question: "What are the message limits for each tier?",
    answer: "Free: 100 messages/month, Basic: 1,000 messages/month, Pro: 10,000 messages/month, Enterprise: 100,000 messages/month.",
    category: "limits"
  },
  {
    question: "How many contacts can I manage?",
    answer: "Free: 50 contacts, Basic: 500 contacts, Pro: 5,000 contacts, Enterprise: Unlimited contacts.",
    category: "limits"
  },
  {
    question: "How many events can I create per month?",
    answer: "Free: 5 events, Basic: 25 events, Pro: 100 events, Enterprise: Unlimited events.",
    category: "limits"
  },
  // Features & Customization
  {
    question: "Which tiers support custom branding and templates?",
    answer: "Pro and Enterprise tiers include full custom branding: your logo, colors, fonts, and custom email templates. Basic tier includes template customization.",
    category: "features"
  },
  {
    question: "Do you offer API access?",
    answer: "API access is available on Pro and Enterprise tiers for integration with your existing systems.",
    category: "features"
  },
  {
    question: "What messaging channels are supported?",
    answer: "All tiers support email and Telegram. SMS is available on Pro and Enterprise tiers.",
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
    answer: "We offer a 30-day money-back guarantee for new subscribers. Contact our support team within 30 days for a full refund.",
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
    answer: "Free: Email support (48-hour response), Basic: Email + chat support (24-hour response), Pro: Priority support (4-hour response), Enterprise: Dedicated account manager + 24/7 support.",
    category: "support"
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely! We use enterprise-grade security: SSL encryption, GDPR compliance, regular backups, and secure data centers.",
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
                  <span className="text-sm">5 events per month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">50 contacts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">100 messages per month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Basic email templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-500">Custom branding</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-500">API access</span>
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
                <div className="text-3xl font-bold text-gray-800">RM29</div>
                <div className="text-gray-600">per month</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">25 events per month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">500 contacts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">1,000 messages per month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Template customization</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Email + chat support</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-500">Custom branding</span>
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
                <div className="text-3xl font-bold text-gray-800">RM79</div>
                <div className="text-gray-600">per month</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">100 events per month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">5,000 contacts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">10,000 messages per month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Custom branding</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">API access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Priority support</span>
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
                <div className="text-3xl font-bold text-gray-800">RM199</div>
                <div className="text-gray-600">per month</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Unlimited events</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Unlimited contacts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">100,000 messages per month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Full custom branding</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Dedicated account manager</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">24/7 support</span>
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
                Start with Basic at RM29/month and scale as you grow.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/pricing">
                  <Button size="lg" variant="secondary" className="bg-white text-orange-500 hover:bg-gray-100">
                    View All Plans
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-orange-500">
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