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
} from "lucide-react"
import Link from "next/link"

export default function FeaturesPage() {
  const mainFeatures = [
    {
      icon: Calendar,
      title: "Smart Event Creation",
      description:
        "Create beautiful events with our intuitive wizard. Choose from wedding, birthday, festival templates and customize every detail.",
      benefits: [
        "Pre-designed templates",
        "Custom event types",
        "Date & time scheduling",
        "Event descriptions & notes",
      ],
    },
    {
      icon: Users,
      title: "Contact Management",
      description:
        "Organize your guest lists effortlessly. Import from CSV, add manually, or sync with your existing contacts.",
      benefits: ["CSV import", "Contact groups & tags", "Duplicate detection", "Search & filter"],
    },
    {
      icon: MessageSquare,
      title: "Multi-Channel Messaging",
      description: "Reach your guests wherever they are. Send invitations via email, WhatsApp, Telegram, and SMS.",
      benefits: ["Email campaigns", "WhatsApp integration", "Telegram messaging", "SMS notifications"],
    },
    {
      icon: Clock,
      title: "Automated Scheduling",
      description:
        "Set it and forget it. Schedule reminders, follow-ups, and recurring events with intelligent timing.",
      benefits: ["Smart reminders", "Recurring events", "Follow-up sequences", "Timezone handling"],
    },
  ]

  const additionalFeatures = [
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Manage events on the go with our responsive design",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Track opens, clicks, and engagement rates",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security for your data",
    },
    {
      icon: Zap,
      title: "Token-Based Pricing",
      description: "Pay only for what you use with flexible tokens",
    },
    {
      icon: Heart,
      title: "Beautiful Templates",
      description: "Professionally designed for every occasion",
    },
    {
      icon: Star,
      title: "Premium Support",
      description: "Get help when you need it most",
    },
  ]

  const pricingTiers = [
    { name: "Free", contacts: "20", tokens: "10", channels: "Email only" },
    { name: "Basic", contacts: "100", tokens: "100", channels: "Email + WhatsApp" },
    { name: "Premium", contacts: "500", tokens: "300", channels: "Email + WhatsApp + Telegram" },
    { name: "Business", contacts: "Unlimited", tokens: "1,000", channels: "All channels + SMS" },
  ]

  return (
    <div className="bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
            Everything You Need for Perfect Events
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            From intimate gatherings to grand celebrations, Sunrise-2025 provides all the tools to create, manage, and
            share your special moments.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
            >
              Start Creating Events
            </Button>
          </Link>
        </div>
      </section>

      {/* Main Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Core Features</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {mainFeatures.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card key={index} className="border-orange-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-orange-100 to-rose-100 rounded-full p-3">
                      <IconComponent className="h-6 w-6 text-orange-500" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
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

      {/* Additional Features Grid */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">More Amazing Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Card key={index} className="text-center border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="bg-gradient-to-r from-orange-100 to-rose-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-8 w-8 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">How It Works</h2>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Create Event</h3>
              <p className="text-gray-600 text-sm">Choose your event type and add details</p>
            </div>
            <div className="text-center">
              <div className="bg-rose-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Add Guests</h3>
              <p className="text-gray-600 text-sm">Import or manually add your contact list</p>
            </div>
            <div className="text-center">
              <div className="bg-amber-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Compose Message</h3>
              <p className="text-gray-600 text-sm">Write invitations or use our templates</p>
            </div>
            <div className="text-center">
              <div className="bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="font-semibold mb-2">Schedule & Send</h3>
              <p className="text-gray-600 text-sm">Set timing and let us handle the rest</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="bg-gradient-to-r from-orange-500 to-rose-500 text-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Choose Your Plan</h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-800 font-semibold">Plan</th>
                  <th className="px-6 py-4 text-center text-gray-800 font-semibold">Contacts</th>
                  <th className="px-6 py-4 text-center text-gray-800 font-semibold">Monthly Tokens</th>
                  <th className="px-6 py-4 text-center text-gray-800 font-semibold">Channels</th>
                </tr>
              </thead>
              <tbody>
                {pricingTiers.map((tier, index) => (
                  <tr key={index} className="border-t border-gray-200">
                    <td className="px-6 py-4">
                      <Badge variant={tier.name === "Basic" ? "default" : "outline"}>{tier.name}</Badge>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-800">{tier.contacts}</td>
                    <td className="px-6 py-4 text-center text-gray-800">{tier.tokens}</td>
                    <td className="px-6 py-4 text-center text-gray-800 text-sm">{tier.channels}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-center mt-8">
            <Link href="/pricing">
              <Button size="lg" variant="secondary" className="bg-white text-orange-500 hover:bg-gray-100">
                View Detailed Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-6 text-gray-800">Ready to Create Beautiful Events?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of users who trust Sunrise-2025 for their special moments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
              >
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
