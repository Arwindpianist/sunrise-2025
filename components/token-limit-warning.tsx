'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, TrendingUp, Zap } from 'lucide-react'
import { getTokenLimitInfo, getUpgradePromptMessage } from '@/lib/token-limits'
import { SubscriptionTier } from '@/lib/subscription'

interface TokenLimitWarningProps {
  tier: SubscriptionTier
  currentBalance: number
  onUpgrade?: () => void
}

export function TokenLimitWarning({ tier, currentBalance, totalTokensPurchased = 0, onUpgrade }: TokenLimitWarningProps & { totalTokensPurchased?: number }) {
  const [limitInfo, setLimitInfo] = useState<any>(null)

  useEffect(() => {
    const info = getTokenLimitInfo(tier, currentBalance, totalTokensPurchased)
    setLimitInfo(info)
  }, [tier, currentBalance, totalTokensPurchased])

  if (!limitInfo || limitInfo.currentLimit === -1) {
    return null // No limit to show
  }

  const percentageUsed = limitInfo.percentageUsed
  const isNearLimit = limitInfo.isNearLimit
  const isAtLimit = limitInfo.isAtLimit

  if (!isNearLimit && !isAtLimit) {
    return null // No warning needed
  }

  const getProgressColor = () => {
    if (isAtLimit) return 'bg-red-500'
    if (isNearLimit) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getAlertVariant = () => {
    if (isAtLimit) return 'destructive'
    if (isNearLimit) return 'default'
    return 'default'
  }

  const getIcon = () => {
    if (isAtLimit) return <AlertTriangle className="h-4 w-4" />
    if (isNearLimit) return <TrendingUp className="h-4 w-4" />
    return <Zap className="h-4 w-4" />
  }

  return (
    <Card className={`border-l-4 ${isAtLimit ? 'border-l-red-500' : 'border-l-yellow-500'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {getIcon()}
          {isAtLimit ? 'Token Limit Reached' : 'Token Limit Warning'}
        </CardTitle>
        <CardDescription>
          {getUpgradePromptMessage(tier, currentBalance, isAtLimit ? 'limit_reached' : 'near_limit')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Token Usage</span>
            <span>{currentBalance} / {limitInfo.currentLimit} tokens</span>
          </div>
          <Progress 
            value={percentageUsed} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(percentageUsed)}% used</span>
            <span>{limitInfo.remainingTokens} remaining</span>
          </div>
        </div>

        {limitInfo.recommendedUpgrade && (
          <Alert variant={getAlertVariant()}>
            <AlertDescription className="flex items-center justify-between">
              <span>
                <strong>Recommended:</strong> Upgrade to {limitInfo.recommendedUpgrade.charAt(0).toUpperCase() + limitInfo.recommendedUpgrade.slice(1)} for unlimited tokens
              </span>
              {onUpgrade && (
                <Button 
                  size="sm" 
                  onClick={onUpgrade}
                  className="ml-4"
                >
                  Upgrade Now
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>Current Plan:</strong> {tier.charAt(0).toUpperCase() + tier.slice(1)}</p>
          <p><strong>Token Limit:</strong> {limitInfo.currentLimit} tokens</p>
          {limitInfo.recommendedUpgrade && (
            <p><strong>Recommended:</strong> {limitInfo.recommendedUpgrade.charAt(0).toUpperCase() + limitInfo.recommendedUpgrade.slice(1)} (unlimited tokens)</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function TokenLimitInfo({ tier, currentBalance, totalTokensPurchased = 0 }: { tier: SubscriptionTier; currentBalance: number; totalTokensPurchased?: number }) {
  const [limitInfo, setLimitInfo] = useState<any>(null)

  useEffect(() => {
    const info = getTokenLimitInfo(tier, currentBalance, totalTokensPurchased)
    setLimitInfo(info)
  }, [tier, currentBalance, totalTokensPurchased])

  if (!limitInfo) return null

  if (limitInfo.currentLimit === -1) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Zap className="h-4 w-4" />
            <span>Unlimited tokens available</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const percentageUsed = limitInfo.percentageUsed
  const getProgressColor = () => {
    if (percentageUsed >= 90) return 'bg-red-500'
    if (percentageUsed >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Token Usage</CardTitle>
        <CardDescription>
          {currentBalance} of {limitInfo.currentLimit} tokens used
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Usage</span>
            <span>{Math.round(percentageUsed)}%</span>
          </div>
          <Progress 
            value={percentageUsed} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{limitInfo.remainingTokens} tokens remaining</span>
            <span>{tier.charAt(0).toUpperCase() + tier.slice(1)} Plan</span>
          </div>
        </div>

        {limitInfo.recommendedUpgrade && (
          <div className="text-xs text-muted-foreground">
            <p>💡 Consider upgrading to {limitInfo.recommendedUpgrade.charAt(0).toUpperCase() + limitInfo.recommendedUpgrade.slice(1)} for unlimited tokens</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 