import { SubscriptionTier, SUBSCRIPTION_FEATURES } from './subscription'

// Check if user can use a specific feature
export function canUseFeature(userTier: SubscriptionTier, feature: string): boolean {
  const features = SUBSCRIPTION_FEATURES[userTier]
  
  switch (feature) {
    case 'telegram':
      return features.canUseTelegram
    case 'schedule_send':
      return userTier === 'basic' || userTier === 'pro' || userTier === 'enterprise'
    case 'email_templates':
      return userTier === 'basic' || userTier === 'pro' || userTier === 'enterprise'
    case 'custom_templates':
      return features.canCustomizeTemplates
    case 'custom_branding':
      return features.canUseCustomBranding
    case 'api_access':
      return features.canUseAPI
    case 'buy_tokens':
      return features.canBuyTokens
    case 'advanced_templates':
      return userTier === 'pro' || userTier === 'enterprise'
    case 'priority_support':
      return userTier === 'pro' || userTier === 'enterprise'
    case 'bulk_import':
      return userTier === 'pro' || userTier === 'enterprise'
    case 'white_label':
      return userTier === 'enterprise'
    case 'dedicated_manager':
      return userTier === 'enterprise'
    default:
      return false
  }
}

// Get feature restriction message
export function getFeatureRestrictionMessage(userTier: SubscriptionTier, feature: string): string {
  switch (feature) {
    case 'telegram':
      if (userTier === 'free') {
        return 'Telegram messaging is available for Basic plans and above.'
      } else if (userTier === 'basic') {
        return 'Telegram messaging is available for Pro plans and above.'
      }
      return ''
    case 'schedule_send':
      if (userTier === 'free') {
        return 'Schedule send is available for Basic plans and above.'
      }
      return ''
    case 'email_templates':
      if (userTier === 'free') {
        return 'Advanced email templates are available for Basic plans and above.'
      }
      return ''
    case 'custom_templates':
      if (userTier === 'free' || userTier === 'basic') {
        return 'Advanced template customization is available for Pro plans and above.'
      }
      return ''
    case 'custom_branding':
      if (userTier === 'free' || userTier === 'basic') {
        return 'Custom branding is available for Pro plans and above.'
      }
      return ''
    case 'api_access':
      if (userTier === 'free' || userTier === 'basic' || userTier === 'pro') {
        return 'API access is available for Enterprise plans only.'
      }
      return ''
    case 'buy_tokens':
      if (userTier === 'free') {
        return 'Token purchases are available for Basic plans and above.'
      }
      return ''
    case 'advanced_templates':
      if (userTier === 'free' || userTier === 'basic') {
        return 'Advanced templates are available for Pro plans and above.'
      }
      return ''
    case 'priority_support':
      if (userTier === 'free' || userTier === 'basic') {
        return 'Priority support is available for Pro plans and above.'
      }
      return ''
    case 'bulk_import':
      if (userTier === 'free' || userTier === 'basic') {
        return 'Bulk contact import is available for Pro plans and above.'
      }
      return ''
    case 'white_label':
      if (userTier === 'free' || userTier === 'basic' || userTier === 'pro') {
        return 'White-label options are available for Enterprise plans only.'
      }
      return ''
    case 'dedicated_manager':
      if (userTier === 'free' || userTier === 'basic' || userTier === 'pro') {
        return 'Dedicated account manager is available for Enterprise plans only.'
      }
      return ''
    default:
      return 'This feature is not available for your current plan.'
  }
}

// Get upgrade recommendation for a feature
export function getFeatureUpgradeRecommendation(userTier: SubscriptionTier, feature: string): { recommended: SubscriptionTier; reason: string } | null {
  if (userTier === 'enterprise') return null
  
  switch (feature) {
    case 'telegram':
      if (userTier === 'free') {
        return {
          recommended: 'basic',
          reason: 'Upgrade to Basic to unlock Telegram messaging'
        }
      }
      break
    case 'schedule_send':
      if (userTier === 'free') {
        return {
          recommended: 'basic',
          reason: 'Upgrade to Basic to unlock schedule send'
        }
      }
      break
    case 'email_templates':
      if (userTier === 'free') {
        return {
          recommended: 'basic',
          reason: 'Upgrade to Basic to unlock advanced email templates'
        }
      }
      break
    case 'custom_templates':
    case 'custom_branding':
    case 'advanced_templates':
    case 'priority_support':
    case 'bulk_import':
      if (userTier === 'free' || userTier === 'basic') {
        return {
          recommended: 'pro',
          reason: 'Upgrade to Pro to unlock advanced features'
        }
      }
      break
    case 'api_access':
    case 'white_label':
    case 'dedicated_manager':
      if (userTier === 'free' || userTier === 'basic' || userTier === 'pro') {
        return {
          recommended: 'enterprise',
          reason: 'Upgrade to Enterprise to unlock API access and white-label options'
        }
      }
      break
    case 'buy_tokens':
      if (userTier === 'free') {
        return {
          recommended: 'basic',
          reason: 'Upgrade to Basic to purchase tokens'
        }
      }
      break
  }
  
  return null
}

// Check if user has reached a limit
export function hasReachedLimit(userTier: SubscriptionTier, currentCount: number, limitType: 'contacts' | 'events' | 'tokens'): boolean {
  const features = SUBSCRIPTION_FEATURES[userTier]
  
  switch (limitType) {
    case 'contacts':
      return features.maxContacts !== -1 && currentCount >= features.maxContacts
    case 'events':
      return features.maxEvents !== -1 && currentCount >= features.maxEvents
    case 'tokens':
      return features.maxTokens !== -1 && currentCount >= features.maxTokens
    default:
      return false
  }
}

// Get limit information
export function getLimitInfo(userTier: SubscriptionTier, currentCount: number, limitType: 'contacts' | 'events' | 'tokens') {
  const features = SUBSCRIPTION_FEATURES[userTier]
  let maxAllowed: number
  
  switch (limitType) {
    case 'contacts':
      maxAllowed = features.maxContacts
      break
    case 'events':
      maxAllowed = features.maxEvents
      break
    case 'tokens':
      maxAllowed = features.maxTokens
      break
    default:
      maxAllowed = 0
  }
  
  const isUnlimited = maxAllowed === -1
  
  if (isUnlimited) {
    return {
      current: currentCount,
      max: 'Unlimited',
      remaining: 'Unlimited',
      percentage: 0,
      isUnlimited: true
    }
  }
  
  const remaining = Math.max(0, maxAllowed - currentCount)
  const percentage = Math.min(100, (currentCount / maxAllowed) * 100)
  
  return {
    current: currentCount,
    max: maxAllowed,
    remaining,
    percentage,
    isUnlimited: false
  }
}

// Get tier display information
export function getTierDisplayInfo(userTier: SubscriptionTier) {
  const features = SUBSCRIPTION_FEATURES[userTier]
  return {
    name: features.name,
    color: userTier === 'enterprise' ? 'text-purple-600' :
           userTier === 'pro' ? 'text-orange-600' :
           userTier === 'basic' ? 'text-blue-600' : 'text-gray-600',
    bgColor: userTier === 'enterprise' ? 'bg-purple-50' :
             userTier === 'pro' ? 'bg-orange-50' :
             userTier === 'basic' ? 'bg-blue-50' : 'bg-gray-50',
    borderColor: userTier === 'enterprise' ? 'border-purple-200' :
                 userTier === 'pro' ? 'border-orange-200' :
                 userTier === 'basic' ? 'border-blue-200' : 'border-gray-200'
  }
} 