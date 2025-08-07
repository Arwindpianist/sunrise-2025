"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, 
  Send, 
  MessageSquare, 
  TrendingUp, 
  Settings, 
  Crown, 
  Users, 
  Calendar,
  CheckCircle,
  Clock,
  Zap
} from "lucide-react"

interface FeatureAvailabilityProps {
  className?: string
  showComingSoon?: boolean
}

export default function FeatureAvailability({ className = "", showComingSoon = true }: FeatureAvailabilityProps) {
  const features: Array<{
    name: string
    icon: React.ComponentType<any>
    free: boolean | string
    basic: boolean | string
    pro: boolean | string
    enterprise: boolean | string
    description: string
    tokenCost: string
  }> = [
    {
      name: "Email Messaging",
      icon: Mail,
      free: true,
      basic: true,
      pro: true,
      enterprise: true,
      description: "Professional email campaigns with rich templates",
      tokenCost: "1 token per email"
    },
    {
      name: "Telegram Integration",
      icon: Send,
      free: false,
      basic: true,
      pro: true,
      enterprise: true,
      description: "Send messages via Telegram bot",
      tokenCost: "2 tokens per message"
    },
    {
      name: "Discord Integration",
      icon: MessageSquare,
      free: false,
      basic: false,
      pro: true,
      enterprise: true,
      description: "Send one message to Discord webhook",
      tokenCost: "1 token per event"
    },
    {
      name: "Slack Integration",
      icon: MessageSquare,
      free: false,
      basic: false,
      pro: true,
      enterprise: true,
      description: "Send one message to Slack channel",
      tokenCost: "1 token per event"
    },
    {
      name: "Custom Templates",
      icon: Settings,
      free: false,
      basic: false,
      pro: true,
      enterprise: true,
      description: "Advanced template customization",
      tokenCost: "Included"
    },
    {
      name: "Custom Branding",
      icon: Crown,
      free: false,
      basic: false,
      pro: true,
      enterprise: true,
      description: "White-label and custom branding",
      tokenCost: "Included"
    },
    {
      name: "Unlimited Contacts",
      icon: Users,
      free: true,
      basic: true,
      pro: true,
      enterprise: true,
      description: "No limit on contact storage",
      tokenCost: "Free"
    },
    {
      name: "Event Limits",
      icon: Calendar,
      free: "5 events",
      basic: "20 events",
      pro: "100 events",
      enterprise: "Unlimited",
      description: "Maximum events per month",
      tokenCost: "Free"
    }
  ]

  const comingSoonFeatures: Array<{
    name: string
    icon: React.ComponentType<any>
    availableFor: string
    description: string
    tokenCost: string
  }> = [
    {
      name: "WhatsApp Integration",
      icon: MessageSquare,
      availableFor: "Pro, Enterprise",
      description: "Direct WhatsApp Business messaging",
      tokenCost: "2 tokens per message"
    },
    {
      name: "SMS Messaging",
      icon: TrendingUp,
      availableFor: "All plans",
      description: "Reliable SMS delivery",
      tokenCost: "3 tokens per SMS"
    },
    {
      name: "Signal Integration",
      icon: MessageSquare,
      availableFor: "Pro, Enterprise",
      description: "End-to-end encrypted messaging",
      tokenCost: "2 tokens per message"
    },
    {
      name: "Viber Integration",
      icon: MessageSquare,
      availableFor: "Pro, Enterprise",
      description: "Viber Business messaging",
      tokenCost: "2 tokens per message"
    }
  ]

  const tiers = [
    { name: "Free", color: "bg-gray-100 text-gray-700" },
    { name: "Basic", color: "bg-blue-100 text-blue-700" },
    { name: "Pro", color: "bg-orange-100 text-orange-700" },
    { name: "Enterprise", color: "bg-purple-100 text-purple-700" }
  ]

    return (
    <div className={className}>
      {/* Unlimited Tokens Banner */}
      <div className="bg-green-500 text-white p-4 rounded-lg mb-4 flex items-center gap-3">
        <Zap className="h-5 w-5" />
        <span className="font-semibold">Unlimited tokens available</span>
      </div>

      {/* Available Features */}
      <div className="space-y-3 mb-6">
        <h3 className="font-semibold text-gray-900 text-sm">Available Features</h3>
        {features.map((feature) => {
          const IconComponent = feature.icon
          const isUnlimited = feature.name.includes("Unlimited") || feature.tokenCost === "Free"
          
          return (
            <div key={feature.name} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                  <IconComponent className="h-3 w-3 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-xs text-gray-900">{feature.name}</p>
                  {isUnlimited && (
                    <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300 mt-1">
                      Unlimited
                    </Badge>
                  )}
                </div>
              </div>
              <CheckCircle className="h-3 w-3 text-green-600" />
            </div>
          )
        })}
      </div>

      {/* Coming Soon Features */}
      {showComingSoon && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">Coming Soon</h3>
          {comingSoonFeatures.map((feature) => {
            const IconComponent = feature.icon
            return (
              <div key={feature.name} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <IconComponent className="h-3 w-3 text-blue-600" />
                  </div>
                  <p className="font-medium text-xs text-gray-900">{feature.name}</p>
                </div>
                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                  Coming Soon
                </Badge>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
} 