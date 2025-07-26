"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Crown, 
  Zap, 
  Coins, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Calendar,
  Users,
  MessageSquare,
  Settings,
  ExternalLink
} from "lucide-react"
import { useSubscription } from "@/lib/use-subscription"
import { SubscriptionTier, SUBSCRIPTION_FEATURES } from "@/lib/subscription"
import UpgradeModal from "./upgrade-modal"

const tierIcons = {
  free: User,
  basic: Coins,
  pro: Zap,
  enterprise: Crown
}

const tierColors = {
  free: "bg-gray-100 text-gray-700 border-gray-200",
  basic: "bg-blue-100 text-blue-700 border-blue-200",
  pro: "bg-orange-100 text-orange-700 border-orange-200",
  enterprise: "bg-purple-100 text-purple-700 border-purple-200"
}

const tierGradients = {
  free: "from-gray-400 to-gray-600",
  basic: "from-blue-400 to-blue-600",
  pro: "from-orange-400 to-orange-600",
  enterprise: "from-purple-400 to-purple-600"
}

export default function SubscriptionStatus() {
  const { 
    subscription, 
    loading, 
    canUseTelegram, 
    canCustomizeTemplates, 
    canUseCustomBranding,
    canBuyTokens,
    remainingTokenAllowance,
    upgrade 
  } = useSubscription()
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeTarget, setUpgradeTarget] = useState<SubscriptionTier>('basic')
  const [upgradeReason, setUpgradeReason] = useState('')

  if (loading) {
    return (
      <Card className="bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="animate-pulse bg-gray-300 h-5 w-5 rounded"></div>
            <div className="animate-pulse bg-gray-300 h-4 w-24 rounded"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="bg-gray-300 h-4 w-full rounded"></div>
            <div className="bg-gray-300 h-4 w-3/4 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return null
  }

  const TierIcon = tierIcons[subscription.tier]
  const features = subscription.features
  const isTrial = subscription.status === 'trial'
  const isActive = subscription.status === 'active'

  const handleUpgradeClick = (targetTier: SubscriptionTier, reason: string) => {
    setUpgradeTarget(targetTier)
    setUpgradeReason(reason)
    setShowUpgradeModal(true)
  }

  const handleUpgrade = async (tier: SubscriptionTier) => {
    try {
      await upgrade(tier)
      setShowUpgradeModal(false)
    } catch (error) {
      console.error('Upgrade failed:', error)
    }
  }

  return (
    <>
      <Card className="bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TierIcon className="h-5 w-5" />
              Subscription Status
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={`${tierColors[subscription.tier]} border`}
              >
                {features.name}
              </Badge>
              {isTrial && (
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  Trial
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subscription Info */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-rose-50 rounded-lg border border-orange-200">
            <div>
              <p className="font-medium text-gray-900">
                {isTrial ? `Trial Period (${subscription.trialDaysRemaining} days left)` : 'Current Plan'}
              </p>
              <p className="text-sm text-gray-600">
                RM{features.monthlyPrice}/month
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                RM{features.tokenPrice}
              </p>
              <p className="text-xs text-gray-500">per token</p>
            </div>
          </div>

          {/* Token Allowance (for Basic tier) */}
          {subscription.tier === 'basic' && remainingTokenAllowance >= 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Lifetime Token Allowance</span>
                <span className="font-medium">
                  {SUBSCRIPTION_FEATURES.basic.maxTokens - subscription.totalTokensPurchased} remaining
                </span>
              </div>
              <Progress 
                value={(subscription.totalTokensPurchased / SUBSCRIPTION_FEATURES.basic.maxTokens) * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-500">
                {subscription.totalTokensPurchased} of {SUBSCRIPTION_FEATURES.basic.maxTokens} tokens used
              </p>
            </div>
          )}

          {/* Feature Status */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Features</h4>
            <div className="grid grid-cols-1 gap-2">
              <FeatureItem 
                icon={MessageSquare}
                title="Telegram Messaging"
                enabled={canUseTelegram}
                onUpgrade={() => handleUpgradeClick('pro', 'Unlock Telegram messaging functionality')}
              />
              <FeatureItem 
                icon={Settings}
                title="Custom Templates"
                enabled={canCustomizeTemplates}
                onUpgrade={() => handleUpgradeClick('pro', 'Unlock advanced template customization')}
              />
              <FeatureItem 
                icon={Crown}
                title="Custom Branding"
                enabled={canUseCustomBranding}
                onUpgrade={() => handleUpgradeClick('pro', 'Unlock custom branding features')}
              />
              <FeatureItem 
                icon={Users}
                title={features.maxContacts === -1 ? "Unlimited Contacts" : `${features.maxContacts} Contacts`}
                enabled={true}
                unlimited={features.maxContacts === -1}
              />
              <FeatureItem 
                icon={Calendar}
                title={features.maxEvents === -1 ? "Unlimited Events" : `${features.maxEvents} Events`}
                enabled={true}
                unlimited={features.maxEvents === -1}
              />
            </div>
          </div>

          {/* Upgrade CTA */}
          {subscription.tier === 'free' && (
            <div className="pt-4 border-t">
              <div className="space-y-3">
                <div className="text-center mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Ready to unlock more features?</p>
                  <p className="text-xs text-gray-500">Choose your upgrade path:</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleUpgradeClick('basic', 'Upgrade to Basic for discounted tokens and more features')}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    Basic Plan
                  </Button>
                  <Button
                    onClick={() => handleUpgradeClick('pro', 'Upgrade to Pro for advanced features and unlimited tokens')}
                    className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Pro Plan
                  </Button>
                </div>
                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open('/pricing', '_blank')}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Compare all plans →
                  </Button>
                </div>
              </div>
            </div>
          )}
          {subscription.tier === 'basic' && (
            <div className="pt-4 border-t">
              <Button
                onClick={() => handleUpgradeClick('pro', 'Upgrade to Pro for advanced features and unlimited tokens')}
                className={`w-full bg-gradient-to-r ${tierGradients[subscription.tier]} hover:opacity-90`}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          )}
          {subscription.tier === 'pro' && (
            <div className="pt-4 border-t">
              <Button
                onClick={() => handleUpgradeClick('enterprise', 'Upgrade to Enterprise for maximum features and support')}
                className={`w-full bg-gradient-to-r ${tierGradients[subscription.tier]} hover:opacity-90`}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Upgrade to Enterprise
              </Button>
            </div>
          )}

          {/* Trial Warning */}
          {isTrial && subscription.trialDaysRemaining && subscription.trialDaysRemaining <= 7 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <p className="text-sm font-medium text-orange-800">
                  Trial ending soon! Upgrade to continue using all features.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={subscription.tier}
        targetTier={upgradeTarget}
        reason={upgradeReason}
        onUpgrade={handleUpgrade}
      />
    </>
  )
}

interface FeatureItemProps {
  icon: React.ComponentType<any>
  title: string
  enabled: boolean
  unlimited?: boolean
  onUpgrade?: () => void
}

function FeatureItem({ icon: Icon, title, enabled, unlimited, onUpgrade }: FeatureItemProps) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-white/50">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${enabled ? 'text-green-600' : 'text-gray-400'}`} />
        <span className="text-sm font-medium">{title}</span>
        {unlimited && (
          <Badge variant="outline" className="text-xs">Unlimited</Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        {enabled ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <>
            <XCircle className="h-4 w-4 text-gray-400" />
            {onUpgrade && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onUpgrade}
                className="text-xs h-6 px-2"
              >
                Upgrade
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
} 