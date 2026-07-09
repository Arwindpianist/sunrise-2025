"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, Crown, Zap, Coins } from "lucide-react"
import { SUBSCRIPTION_FEATURES, SubscriptionTier, getFeatureComparison } from "@/lib/subscription"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentTier: SubscriptionTier
  targetTier: SubscriptionTier
  reason: string
  onUpgrade: (tier: SubscriptionTier) => Promise<any>
}

const tierIcons: Record<Exclude<SubscriptionTier, 'free'>, React.ComponentType<any>> = {
  basic: Coins,
  pro: Zap,
  enterprise: Crown
}

const tierCardClass: Record<Exclude<SubscriptionTier, "free">, string> = {
  basic: "border-sky-500/40 bg-sky-500/10 text-foreground",
  pro: "border-primary/40 bg-primary/10 text-foreground",
  enterprise: "border-violet-500/40 bg-violet-500/10 text-foreground",
}

const tierCtaClass: Record<Exclude<SubscriptionTier, "free">, string> = {
  basic: "bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-500",
  pro: "bg-primary text-primary-foreground hover:bg-primary/90",
  enterprise: "bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500",
}

export default function UpgradeModal({
  isOpen,
  onClose,
  currentTier,
  targetTier,
  reason,
  onUpgrade
}: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  // Add safety checks to prevent undefined errors
  const currentFeatures = SUBSCRIPTION_FEATURES[currentTier] || SUBSCRIPTION_FEATURES.free
  const targetFeatures = SUBSCRIPTION_FEATURES[targetTier] || SUBSCRIPTION_FEATURES.basic
  const comparison = getFeatureComparison(currentTier, targetTier)
  
  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      const result = await onUpgrade(targetTier)
      
      // If we get a URL, redirect to Stripe checkout
      if (result && result.url) {
        window.location.href = result.url
        return
      }
      
      // If we get a client secret, we need to redirect to payment
      if (result && result.clientSecret) {
        // Redirect to payment page or handle payment flow
        window.location.href = `/dashboard/balance?payment_intent=${result.clientSecret}`
        return
      }
      
      // If no URL or client secret, upgrade was successful
      onClose()
    } catch (error) {
      console.error('Upgrade failed:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const TargetIcon = targetTier !== 'free' ? tierIcons[targetTier] : Coins
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <TargetIcon className="h-6 w-6" />
            Upgrade to {targetFeatures.name}
          </DialogTitle>
          <DialogDescription className="text-base">
            {reason}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current vs Target Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Plan */}
            <Card className="border-border bg-card/80">
              <CardHeader>
                <CardTitle className="text-muted-foreground">Current: {currentFeatures.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold text-muted-foreground">
                  RM{currentFeatures.monthlyPrice}/month
                </div>
                <div className="space-y-2">
                  {currentFeatures.features.slice(0, 5).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {currentFeatures.restrictions.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Restrictions:</div>
                      {currentFeatures.restrictions.slice(0, 3).map((restriction, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <X className="h-4 w-4" />
                          <span>{restriction}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Target Plan */}
            <Card className={`border-2 ${targetTier !== "free" ? tierCardClass[targetTier] : "border-border bg-muted text-foreground"}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TargetIcon className="h-5 w-5" />
                  {targetFeatures.name}
                  <Badge variant="secondary" className="ml-auto">
                    Recommended
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold">
                  RM{targetFeatures.monthlyPrice}/month
                </div>
                <div className="space-y-2">
                  {targetFeatures.features.slice(0, 5).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {targetFeatures.restrictions.length === 0 && (
                    <div className="pt-2 border-t border-border">
                      <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        No restrictions!
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* New Features You'll Get */}
          {comparison.newFeatures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">New Features You'll Get</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {comparison.newFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 rounded-lg border border-emerald-500/35 bg-emerald-500/10 p-3">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Restrictions You'll Lose */}
          {comparison.removedRestrictions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Restrictions You'll Lose</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {comparison.removedRestrictions.map((restriction, index) => (
                    <div key={index} className="flex items-center gap-2 rounded-lg border border-sky-500/35 bg-sky-500/10 p-3">
                      <X className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      <span className="text-sm font-medium line-through">{restriction}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Pricing Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pricing Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center rounded-lg bg-muted p-3">
                  <span className="font-medium">Token Price:</span>
                  <div className="text-right">
                    <span className="text-muted-foreground line-through">RM{currentFeatures.tokenPrice}</span>
                    <span className="ml-2 font-bold text-emerald-700 dark:text-emerald-400">RM{targetFeatures.tokenPrice}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center rounded-lg bg-muted p-3">
                  <span className="font-medium">Monthly Cost:</span>
                  <div className="text-right">
                    <span className="text-muted-foreground line-through">RM{currentFeatures.monthlyPrice}</span>
                    <span className="ml-2 font-bold text-emerald-700 dark:text-emerald-400">RM{targetFeatures.monthlyPrice}</span>
                  </div>
                </div>
                {targetTier === 'pro' && currentTier === 'basic' && (
                  <div className="rounded-lg border border-primary/35 bg-primary/10 p-3">
                    <div className="text-sm font-medium text-foreground">
                      💡 Pro tip: Upgrade to Pro to remove the 100-token lifetime limit!
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleUpgrade}
              disabled={isLoading}
              className={`flex-1 ${targetTier !== "free" ? tierCtaClass[targetTier] : "bg-muted text-foreground hover:bg-muted/80"}`}
            >
              {isLoading ? "Processing..." : `Upgrade to ${targetFeatures.name}`}
            </Button>
          </div>
          
          {/* Money-back guarantee */}
          <div className="text-center text-sm text-muted-foreground">
            <p>30-day money-back guarantee • Cancel anytime</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 