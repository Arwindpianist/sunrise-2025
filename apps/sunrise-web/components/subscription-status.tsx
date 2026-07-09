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
  AlertTriangle,
  Calendar,
  Users,
  MessageSquare,
  Settings,
  ExternalLink,
  Mail,
  Send,
  TrendingUp
} from "lucide-react"
import { useSubscription } from "@/lib/use-subscription"
import { SubscriptionTier, SUBSCRIPTION_FEATURES } from "@/lib/subscription"
import UpgradeModal from "./upgrade-modal"
import { TokenLimitInfo, TokenLimitWarning } from "@/components/token-limit-warning"

const tierIcons = {
  free: User,
  basic: Coins,
  pro: Zap,
  enterprise: Crown
}

const tierColors = {
  free: "bg-muted text-muted-foreground border-border",
  basic: "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300",
  pro: "border-primary/30 bg-primary/15 text-primary",
  enterprise: "border-violet-500/30 bg-violet-500/15 text-violet-700 dark:text-violet-300",
}

const tierCtaClass = {
  free: "bg-muted text-foreground hover:bg-muted/80",
  basic: "bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-500",
  pro: "bg-primary text-primary-foreground hover:bg-primary/90",
  enterprise: "bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500",
}

export default function SubscriptionStatus() {
  const { 
    subscription, 
    loading, 
    userBalance,
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
      <Card className="border border-border/80 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded bg-muted"></div>
            <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-full rounded bg-muted"></div>
            <div className="h-4 w-3/4 rounded bg-muted"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return null
  }

  const TierIcon = tierIcons[subscription.tier] || tierIcons.free
  const features = subscription.features || SUBSCRIPTION_FEATURES.free
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
      <Card className="border border-border/80 bg-card">
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
                <Badge variant="outline" className="border-primary/40 text-primary">
                  Trial
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subscription Info */}
          <div className="flex items-center justify-between rounded-lg border border-primary/35 bg-primary/10 p-3">
            <div>
              <p className="font-medium text-foreground">
                {isTrial ? `Trial Period (${subscription.trialDaysRemaining} days left)` : 'Current Plan'}
              </p>
              <p className="text-sm text-muted-foreground">
                RM{features.monthlyPrice}/month
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                RM{features.tokenPrice}
              </p>
              <p className="text-xs text-muted-foreground">per token</p>
            </div>
          </div>

          {/* Token Limit Progress */}
          <TokenLimitInfo 
            tier={subscription.tier} 
            currentBalance={userBalance} 
            totalTokensPurchased={subscription.totalTokensPurchased}
          />

          {/* Token Limit Warning */}
          <TokenLimitWarning 
            tier={subscription.tier} 
            currentBalance={userBalance} 
            totalTokensPurchased={subscription.totalTokensPurchased}
            onUpgrade={() => handleUpgradeClick('pro', 'Unlock unlimited tokens')}
          />

          {/* Feature Status */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Available Features</h4>
            <div className="grid grid-cols-1 gap-2">
              <FeatureItem 
                icon={Mail}
                title="Email Messaging"
                enabled={true}
                unlimited={true}
              />
              <FeatureItem 
                icon={Send}
                title="Telegram Messaging"
                enabled={canUseTelegram}
                onUpgrade={() => handleUpgradeClick('basic', 'Unlock Telegram messaging functionality')}
              />
              <FeatureItem 
                icon={MessageSquare}
                title="Discord Integration"
                enabled={subscription.tier === 'pro' || subscription.tier === 'enterprise'}
                onUpgrade={() => handleUpgradeClick('pro', 'Unlock Discord integration')}
              />
              <FeatureItem 
                icon={MessageSquare}
                title="Slack Integration"
                enabled={subscription.tier === 'pro' || subscription.tier === 'enterprise'}
                onUpgrade={() => handleUpgradeClick('pro', 'Unlock Slack integration')}
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

          {/* Coming Soon Features */}
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-foreground">Coming Soon</h4>
              <p className="mt-0.5 text-xs text-muted-foreground">Channels on our roadmap</p>
            </div>
            <div className="space-y-2">
              <ComingSoonFeature 
                icon={MessageSquare}
                title="WhatsApp Integration"
              />
              <ComingSoonFeature 
                icon={TrendingUp}
                title="SMS Messaging"
              />
              <ComingSoonFeature 
                icon={MessageSquare}
                title="Signal Integration"
              />
              <ComingSoonFeature 
                icon={MessageSquare}
                title="Viber Integration"
              />
            </div>
          </div>

          {/* Upgrade CTA */}
          {subscription.tier === 'free' && (
            <div className="pt-4 border-t">
              <div className="space-y-3">
                <div className="text-center mb-3">
                  <p className="mb-1 text-sm font-medium text-foreground">Ready to unlock more features?</p>
                  <p className="text-xs text-muted-foreground">Choose your upgrade path:</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleUpgradeClick('basic', 'Upgrade to Basic for discounted tokens and more features')}
                    className="w-full bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-500"
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    Basic Plan
                  </Button>
                  <Button
                    onClick={() => handleUpgradeClick('pro', 'Upgrade to Pro for advanced features and unlimited tokens')}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
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
                    className="text-xs text-muted-foreground hover:text-foreground"
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
                className={`w-full ${tierCtaClass[subscription.tier]}`}
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
                className={`w-full ${tierCtaClass[subscription.tier]}`}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Upgrade to Enterprise
              </Button>
            </div>
          )}

          {/* Trial Warning */}
          {isTrial && subscription.trialDaysRemaining && subscription.trialDaysRemaining <= 7 && (
            <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <p className="text-sm font-medium text-foreground">
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
  comingSoon?: boolean
  onUpgrade?: () => void
}

function FeatureItem({ icon: Icon, title, enabled, unlimited, comingSoon, onUpgrade }: FeatureItemProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-2">
      <div className="flex items-center gap-2">
        <Icon
          className={`h-3 w-3 ${enabled ? "text-emerald-600 dark:text-emerald-400" : comingSoon ? "text-primary" : "text-muted-foreground"}`}
        />
        <span className="text-xs font-medium text-foreground">{title}</span>
        {unlimited && (
          <Badge variant="outline" className="text-xs">Unlimited</Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        {enabled ? (
          <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
        ) : comingSoon ? (
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-xs text-primary">
            Coming Soon
          </Badge>
        ) : (
          onUpgrade && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onUpgrade}
              className="text-xs h-5 px-2"
            >
              Upgrade
            </Button>
          )
        )}
      </div>
    </div>
  )
}

interface ComingSoonFeatureProps {
  icon: React.ComponentType<any>
  title: string
}

function ComingSoonFeature({ icon: Icon, title }: ComingSoonFeatureProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
    </div>
  )
} 