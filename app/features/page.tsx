import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Users,
  MessageSquare,
  Clock,
  Smartphone,
  BarChart3,
  Shield,
  Zap,
  Heart,
  CheckCircle,
  Star,
  Mail,
  MessageCircle,
  Send,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"

export default function FeaturesPage() {
  const mainFeatures = [
    {
      icon: Calendar,
      title: "Smart Event Creation",
      description:
        "Create beautiful events with our intuitive wizard. Choose from wedding, birthday, festival templates and customize every detail with token-efficient design.",
      benefits: [
        "Pre-designed templates (1 token per event)",
        "Custom event types & branding",
        "Smart date & time scheduling",
        "Rich event descriptions & notes",
      ],
    },
    {
      icon: Users,
      title: "Smart Contact Management",
      description:
        "Organize your guest lists with flexible categories. Import from Google Contacts, vCard files, CSV, or add manually with intelligent organization.",
      benefits: ["Google Contacts import (free)", "vCard/CSV import (free)", "Custom categories & tags", "Color-coded organization"],
    },
    {
      icon: MessageSquare,
      title: "Multi-Channel Messaging",
      description: "Reach your guests wherever they are. Send invitations via email, Telegram, and SMS with optimal token usage.",
      benefits: ["Email campaigns (1 token)", "Telegram messaging (2 tokens)", "SMS notifications (3 tokens)", "Advanced templates"],
    },
    {
      icon: Clock,
      title: "Automated Scheduling",
      description:
        "Set it and forget it. Schedule reminders, follow-ups, and recurring events with intelligent timing and token optimization.",
      benefits: ["Smart reminders (1 token each)", "Recurring events (bulk discount)", "Follow-up sequences", "Timezone handling"],
    },
  ]

  const additionalFeatures = [
    {
      icon: Smartphone,
      title: "Mobile-Friendly Interface",
      description: "Manage events on the go with our responsive design. No additional tokens for mobile access.",
    },
    {
      icon: BarChart3,
      title: "Email Tracking",
      description: "Track opens, clicks, and engagement rates. Free analytics dashboard included.",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security for your data. Bank-level encryption included.",
    },
    {
      icon: Zap,
      title: "Discounted Token Pricing",
      description: "Pay only for what you use with flexible tokens. Subscribe for better rates.",
    },
    {
      icon: Heart,
      title: "Advanced Email Templates",
      description: "Professionally designed templates for every occasion. Premium templates for Pro+.",
    },
    {
      icon: Star,
      title: "Priority Support",
      description: "Get help when you need it most. Priority support for Pro and Enterprise plans.",
    },
  ]

  const tokenPricing = [
    { 
      name: "Free", 
      contacts: "Unlimited contacts", 
      tokenRate: "Standard Value", 
      channels: "Email only", 
      savings: "No discount",
      features: ["15 free tokens", "Basic templates", "Up to 5 events", "Email support"]
    },
    { 
      name: "Basic", 
      contacts: "Unlimited contacts", 
      tokenRate: "Good Value", 
      channels: "Email + Telegram", 
      savings: "Save 10%",
      features: ["Discounted tokens", "Telegram messaging", "Smart contact management", "Up to 20 events", "Priority support"]
    },
    { 
      name: "Pro", 
      contacts: "Up to 1000 contacts", 
      tokenRate: "Great Value", 
      channels: "Email + Telegram + More", 
      savings: "Save 20%",
      features: ["Unlimited tokens", "Telegram messaging", "Discord, Slack, Signal, Viber (Coming Soon)", "Custom branding", "Up to 100 events"]
    },
    { 
      name: "Enterprise", 
      contacts: "Unlimited contacts", 
      tokenRate: "Best Value", 
      channels: "All channels + SMS", 
      savings: "Save 30%",
      features: ["Unlimited everything", "API access", "White-label options", "Dedicated support"]
    },
  ]

  const messagingChannels = [
    {
      icon: Mail,
      name: "Email",
      description: "Professional email campaigns",
      tokenCost: "1 token per email",
      features: ["Rich HTML templates", "Open tracking", "Click analytics"]
    },
    {
      icon: Send,
      name: "Telegram",
      description: "Telegram bot integration (Basic+)",
      tokenCost: "2 tokens per message",
      features: ["Channel broadcasting", "Group messaging", "File sharing"]
    },
    {
      icon: MessageCircle,
      name: "WhatsApp",
      description: "Direct WhatsApp messaging (Coming Soon)",
      tokenCost: "2 tokens per message",
      features: ["Media support", "Delivery receipts", "Quick replies"]
    },
    {
      icon: TrendingUp,
      name: "SMS",
      description: "Reliable SMS delivery (Coming Soon)",
      tokenCost: "3 tokens per SMS",
      features: ["Global delivery", "Delivery reports", "Bulk sending"]
    },
    {
      icon: MessageCircle,
      name: "Discord",
      description: "Discord bot integration (Coming Soon)",
      tokenCost: "2 tokens per message",
      features: ["Server notifications", "Channel messaging", "Role-based sending"]
    },
    {
      icon: MessageCircle,
      name: "Slack",
      description: "Slack workspace integration (Coming Soon)",
      tokenCost: "2 tokens per message",
      features: ["Channel notifications", "Direct messaging", "Thread replies"]
    },
    {
      icon: MessageCircle,
      name: "Signal",
      description: "Signal messaging (Coming Soon)",
      tokenCost: "2 tokens per message",
      features: ["End-to-end encryption", "Group messaging", "Media sharing"]
    },
    {
      icon: MessageCircle,
      name: "Viber",
      description: "Viber messaging (Coming Soon)",
      tokenCost: "2 tokens per message",
      features: ["Public chat integration", "Sticker support", "Voice messages"]
    }
  ]

  return (
    <div className="bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-6 sm:px-8 py-20 sm:py-24 text-center">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-8 bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent leading-tight">
            Everything You Need for Perfect Events
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-10 leading-relaxed max-w-4xl mx-auto">
            From intimate gatherings to grand celebrations, Sunrise-2025 provides all the tools to create, manage, and
            share your special moments with token-efficient messaging.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 h-14 text-lg font-medium px-8"
              >
                Start Creating Events
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="border-orange-500 text-orange-500 hover:bg-orange-50 h-14 text-lg font-medium px-8"
              >
                View Token Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="container mx-auto px-6 sm:px-8 py-20">
        <h2 className="text-3xl sm:text-5xl font-bold text-center mb-12 sm:mb-16 text-gray-800">Core Features</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
          {mainFeatures.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card key={index} className="border-orange-200 hover:shadow-xl transition-shadow duration-300 shadow-lg">
                <CardHeader className="px-8 pt-8 pb-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-orange-100 to-rose-100 rounded-full p-4">
                      <IconComponent className="h-8 w-8 text-orange-500" />
                    </div>
                    <CardTitle className="text-2xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <p className="text-gray-600 mb-6 text-lg leading-relaxed">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center text-base">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Messaging Channels */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6 sm:px-8">
          <h2 className="text-3xl sm:text-5xl font-bold text-center mb-12 sm:mb-16 text-gray-800">Messaging Channels</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Reach your guests through multiple channels with transparent token pricing
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {messagingChannels.map((channel, index) => {
              const IconComponent = channel.icon
              return (
                <Card key={index} className="text-center border-gray-200 hover:shadow-xl transition-shadow duration-300 shadow-lg">
                  <CardContent className="p-8">
                    <div className="bg-gradient-to-r from-orange-100 to-rose-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                      <IconComponent className="h-10 w-10 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{channel.name}</h3>
                    <p className="text-gray-600 mb-4">{channel.description}</p>
                    <div className="bg-orange-50 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-orange-800">{channel.tokenCost}</p>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {channel.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="container mx-auto px-6 sm:px-8 py-20">
        <h2 className="text-3xl sm:text-5xl font-bold text-center mb-12 sm:mb-16 text-gray-800">More Amazing Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {additionalFeatures.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card key={index} className="text-center border-gray-200 hover:shadow-xl transition-shadow duration-300 shadow-lg">
                <CardContent className="p-8">
                  <div className="bg-gradient-to-r from-orange-100 to-rose-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <IconComponent className="h-10 w-10 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6 sm:px-8">
          <h2 className="text-3xl sm:text-5xl font-bold text-center mb-12 sm:mb-16 text-gray-800">How It Works</h2>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              <div className="text-center">
                <div className="bg-orange-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  1
                </div>
                <h3 className="font-semibold mb-4 text-lg">Create Event</h3>
                <p className="text-gray-600">Choose your event type and add details with our intuitive wizard</p>
              </div>
              <div className="text-center">
                <div className="bg-rose-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  2
                </div>
                <h3 className="font-semibold mb-4 text-lg">Add Guests</h3>
                <p className="text-gray-600">Import or manually add your contact list with smart organization</p>
              </div>
              <div className="text-center">
                <div className="bg-amber-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  3
                </div>
                <h3 className="font-semibold mb-4 text-lg">Compose Message</h3>
                <p className="text-gray-600">Write invitations or use our beautiful templates</p>
              </div>
              <div className="text-center">
                <div className="bg-green-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  4
                </div>
                <h3 className="font-semibold mb-4 text-lg">Schedule & Send</h3>
                <p className="text-gray-600">Set timing and let us handle the rest with token efficiency</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Token Pricing Comparison */}
      <section className="bg-gradient-to-r from-orange-500 to-rose-500 text-white py-20">
        <div className="container mx-auto px-6 sm:px-8">
          <h2 className="text-3xl sm:text-5xl font-bold text-center mb-12 sm:mb-16">Choose Your Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {tokenPricing.map((tier, index) => (
              <Card key={index} className={`text-center bg-white/10 backdrop-blur-sm ${
                tier.name === "Pro" 
                  ? "border-2 border-white shadow-2xl scale-105 bg-white/20" 
                  : "border border-white/30 hover:bg-white/15 transition-colors"
              }`}>
                <CardHeader className="pb-6">
                  <Badge variant={tier.name === "Pro" ? "default" : "outline"} className={`text-lg px-4 py-2 ${
                    tier.name === "Pro" 
                      ? "bg-white text-orange-500 font-semibold" 
                      : "border-white text-white bg-transparent"
                  }`}>
                    {tier.name}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold mb-2 text-white">{tier.tokenRate}</p>
                    <p className="text-orange-100 text-base font-medium">{tier.savings}</p>
                  </div>
                  <div className="space-y-3 bg-white/10 rounded-lg p-4">
                    <p className="text-sm text-white/90"><strong className="text-white">Contacts:</strong> {tier.contacts}</p>
                    <p className="text-sm text-white/90"><strong className="text-white">Channels:</strong> {tier.channels}</p>
                  </div>
                  <ul className="space-y-3 text-sm">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-white/90">
                        <CheckCircle className="h-5 w-5 text-green-300 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/pricing">
              <Button size="lg" variant="secondary" className="bg-white text-orange-500 hover:bg-gray-100 h-14 text-lg font-medium px-8 shadow-lg">
                View Detailed Token Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 sm:px-8 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-bold mb-8 text-gray-800">Ready to Create Beautiful Events?</h2>
          <p className="text-xl sm:text-2xl text-gray-600 mb-10 leading-relaxed">
            Join thousands of users who trust Sunrise-2025 for their special moments. Start with 15 free tokens today.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 h-14 text-lg font-medium px-8"
              >
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button 
                size="lg" 
                variant="outline"
                className="border-orange-500 text-orange-500 hover:bg-orange-50 h-14 text-lg font-medium px-8"
              >
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
