// Subscription tiers and their features
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

export interface SubscriptionFeatures {
  tier: SubscriptionTier;
  name: string;
  maxTokens: number;
  maxContacts: number;
  maxEvents: number;
  canUseTelegram: boolean;
  canCustomizeTemplates: boolean;
  canUseCustomBranding: boolean;
  canUseAPI: boolean;
  canBuyTokens: boolean;
  tokenPrice: number;
  monthlyPrice: number;
  monthlyTokens: number; // Monthly tokens included with subscription
  features: string[];
  restrictions: string[];
}

export const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  free: {
    tier: 'free',
    name: 'Free',
    maxTokens: 15, // Trial tokens only
    maxContacts: -1, // Unlimited contacts
    maxEvents: 5,
    canUseTelegram: false,
    canCustomizeTemplates: false,
    canUseCustomBranding: false,
    canUseAPI: false,
    canBuyTokens: false, // Cannot buy tokens without subscription
    tokenPrice: 0.50,
    monthlyPrice: 0,
    monthlyTokens: 0, // No monthly tokens for free users
    features: [
      '15 trial tokens',
      'Basic email templates',
      'Unlimited contacts',
      'Up to 5 events',
      'Email sending only'
    ],
    restrictions: [
      'No Telegram functionality',
      'Cannot buy additional tokens',
      'No custom branding',
      'No API access',
      'Limited template customization'
    ]
  },
  basic: {
    tier: 'basic',
    name: 'Basic',
    maxTokens: 100, // Lifetime limit to push towards Pro
    maxContacts: -1, // Unlimited contacts
    maxEvents: 20,
    canUseTelegram: false,
    canCustomizeTemplates: false,
    canUseCustomBranding: false,
    canUseAPI: false,
    canBuyTokens: true,
    tokenPrice: 0.45,
    monthlyPrice: 9.90,
    monthlyTokens: 10, // 10 tokens per month
    features: [
      '10 tokens included monthly',
      'Discounted token prices (RM0.45/token)',
      'Smart contact management',
      'Event scheduling',
      'Email tracking',
      'Basic email templates',
      'Mobile-friendly interface',
      'Unlimited contacts',
      'Up to 20 events'
    ],
    restrictions: [
      'No Telegram functionality',
      'Limited to 100 tokens lifetime',
      'No custom branding',
      'No API access',
      'Basic template customization only'
    ]
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    maxTokens: -1, // Unlimited
    maxContacts: 1000,
    maxEvents: 100,
    canUseTelegram: true,
    canCustomizeTemplates: true,
    canUseCustomBranding: true,
    canUseAPI: false,
    canBuyTokens: true,
    tokenPrice: 0.40,
    monthlyPrice: 29.90,
    monthlyTokens: 30, // 30 tokens per month
    features: [
      '30 tokens included monthly',
      'Discounted token prices (RM0.40/token)',
      'Advanced email templates',
      'Telegram messaging',
      'Smart contact management',
      'Event scheduling',
      'Email tracking',
      'Priority support',
      'Custom branding',
      'Bulk contact import',
      'Unlimited tokens',
      'Up to 1000 contacts',
      'Up to 100 events'
    ],
    restrictions: [
      'No API access',
      'No white-label options'
    ]
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    maxTokens: -1, // Unlimited
    maxContacts: -1, // Unlimited
    maxEvents: -1, // Unlimited
    canUseTelegram: true,
    canCustomizeTemplates: true,
    canUseCustomBranding: true,
    canUseAPI: true,
    canBuyTokens: true,
    tokenPrice: 0.35,
    monthlyPrice: 79.90,
    monthlyTokens: 100, // 100 tokens per month
    features: [
      '100 tokens included monthly',
      'Discounted token prices (RM0.35/token)',
      'Premium email templates',
      'Telegram messaging',
      'Smart contact management',
      'Event scheduling',
      'Email tracking',
      'Priority support',
      'Custom branding',
      'API access',
      'Dedicated account manager',
      'White-label options',
      'Unlimited everything'
    ],
    restrictions: []
  }
};

// User subscription data structure
export interface UserSubscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: 'active' | 'inactive' | 'cancelled' | 'trial';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
  total_tokens_purchased: number; // For basic tier lifetime limit
}

// Check if user can perform a specific action
export function canPerformAction(
  userTier: SubscriptionTier,
  action: 'use_telegram' | 'customize_templates' | 'custom_branding' | 'use_api' | 'buy_tokens'
): boolean {
  const features = SUBSCRIPTION_FEATURES[userTier];
  
  switch (action) {
    case 'use_telegram':
      return features.canUseTelegram;
    case 'customize_templates':
      return features.canCustomizeTemplates;
    case 'custom_branding':
      return features.canUseCustomBranding;
    case 'use_api':
      return features.canUseAPI;
    case 'buy_tokens':
      return features.canBuyTokens;
    default:
      return false;
  }
}

// Check if user can buy more tokens (considering lifetime limits)
export function canBuyTokens(
  userTier: SubscriptionTier,
  totalTokensPurchased: number
): boolean {
  const features = SUBSCRIPTION_FEATURES[userTier];
  
  if (!features.canBuyTokens) return false;
  
  // Basic tier has lifetime limit
  if (userTier === 'basic' && features.maxTokens !== -1) {
    return totalTokensPurchased < features.maxTokens;
  }
  
  return true;
}

// Check if user has reached contact limit
export function hasReachedContactLimit(
  userTier: SubscriptionTier,
  currentContactCount: number
): boolean {
  const features = SUBSCRIPTION_FEATURES[userTier];
  return features.maxContacts !== -1 && currentContactCount >= features.maxContacts;
}

// Check if user has reached event limit
export function hasReachedEventLimit(
  userTier: SubscriptionTier,
  currentEventCount: number
): boolean {
  const features = SUBSCRIPTION_FEATURES[userTier];
  return features.maxEvents !== -1 && currentEventCount >= features.maxEvents;
}

// Get upgrade recommendation
export function getUpgradeRecommendation(
  userTier: SubscriptionTier,
  reason?: 'telegram' | 'tokens' | 'contacts' | 'events' | 'customization'
): { recommended: SubscriptionTier; reason: string } | null {
  if (userTier === 'enterprise') return null;
  
  switch (reason) {
    case 'telegram':
      if (userTier === 'free' || userTier === 'basic') {
        return {
          recommended: 'pro',
          reason: 'Upgrade to Pro to unlock Telegram messaging functionality'
        };
      }
      break;
    case 'tokens':
      if (userTier === 'free') {
        return {
          recommended: 'basic',
          reason: 'Upgrade to Basic to purchase additional tokens'
        };
      }
      if (userTier === 'basic') {
        return {
          recommended: 'pro',
          reason: 'Upgrade to Pro for unlimited token purchases'
        };
      }
      break;
    case 'contacts':
      if (userTier === 'free') {
        return {
          recommended: 'basic',
          reason: 'Upgrade to Basic for more contacts (up to 200)'
        };
      }
      if (userTier === 'basic') {
        return {
          recommended: 'pro',
          reason: 'Upgrade to Pro for more contacts (up to 1000)'
        };
      }
      break;
    case 'events':
      if (userTier === 'free') {
        return {
          recommended: 'basic',
          reason: 'Upgrade to Basic for more events (up to 20)'
        };
      }
      if (userTier === 'basic') {
        return {
          recommended: 'pro',
          reason: 'Upgrade to Pro for more events (up to 100)'
        };
      }
      break;
    case 'customization':
      if (userTier === 'free' || userTier === 'basic') {
        return {
          recommended: 'pro',
          reason: 'Upgrade to Pro for advanced template customization and branding'
        };
      }
      break;
  }
  
  // Default upgrade path
  switch (userTier) {
    case 'free':
      return {
        recommended: 'basic',
        reason: 'Upgrade to Basic for more features and token purchasing'
      };
    case 'basic':
      return {
        recommended: 'pro',
        reason: 'Upgrade to Pro for Telegram messaging and unlimited tokens'
      };
    case 'pro':
      return {
        recommended: 'enterprise',
        reason: 'Upgrade to Enterprise for API access and white-label options'
      };
    default:
      return null;
  }
}

// Get feature comparison for upgrade modal
export function getFeatureComparison(currentTier: SubscriptionTier, targetTier: SubscriptionTier) {
  const current = SUBSCRIPTION_FEATURES[currentTier];
  const target = SUBSCRIPTION_FEATURES[targetTier];
  
  return {
    current: current,
    target: target,
    newFeatures: target.features.filter(feature => !current.features.includes(feature)),
    removedRestrictions: current.restrictions.filter(restriction => !target.restrictions.includes(restriction))
  };
}

// Calculate remaining tokens for basic tier
export function getRemainingTokenAllowance(
  userTier: SubscriptionTier,
  totalTokensPurchased: number
): number {
  if (userTier !== 'basic') return -1; // Unlimited
  
  const features = SUBSCRIPTION_FEATURES[userTier];
  const remaining = features.maxTokens - totalTokensPurchased;
  return Math.max(0, remaining);
} 