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
  /** When false, hides the promotional banner at the top (e.g. playground comparisons). */
  showPromoBanner?: boolean
}

export default function FeatureAvailability({
  className = "",
  showComingSoon = true,
  showPromoBanner = true,
}: FeatureAvailabilityProps) {
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
    { name: "Free", color: "bg-muted text-muted-foreground" },
    { name: "Basic", color: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
    { name: "Pro", color: "bg-primary/15 text-primary" },
    { name: "Enterprise", color: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
  ]

    return (
    <div className={className}>
      {showPromoBanner ? (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-emerald-600 p-4 text-white dark:bg-emerald-600">
          <Zap className="h-5 w-5" />
          <span className="font-semibold">Unlimited tokens available</span>
        </div>
      ) : null}

      {/* Available Features */}
      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-semibold text-foreground">Available Features</h3>
        {features.map((feature) => {
          const IconComponent = feature.icon
          const isUnlimited = feature.name.includes("Unlimited") || feature.tokenCost === "Free"
          
          return (
            <div
              key={feature.name}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                  <IconComponent className="h-3 w-3 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{feature.name}</p>
                  {isUnlimited && (
                    <Badge variant="outline" className="mt-1 border-border bg-muted text-xs text-muted-foreground">
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
          <div>
            <h3 className="text-sm font-semibold text-foreground">Coming Soon</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Channels on our roadmap</p>
          </div>
          {comingSoonFeatures.map((feature) => {
            const IconComponent = feature.icon
            return (
              <div
                key={feature.name}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                  <IconComponent className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{feature.name}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
} 