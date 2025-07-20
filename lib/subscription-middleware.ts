import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { 
  SubscriptionTier, 
  SUBSCRIPTION_FEATURES, 
  canPerformAction, 
  canBuyTokens,
  hasReachedContactLimit,
  hasReachedEventLimit,
  getUpgradeRecommendation 
} from "./subscription";

// Get user's current subscription tier
export async function getUserSubscriptionTier(): Promise<SubscriptionTier> {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return 'free';
  
  // Check if user has a subscription record
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('tier, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .single();
  
  if (subscription) {
    return subscription.tier as SubscriptionTier;
  }
  
  // Check if user is within trial period (30 days from signup)
  const { data: profile } = await supabase.auth.getUser();
  if (profile.user) {
    const createdAt = new Date(profile.user.created_at);
    const now = new Date();
    const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreation <= 30) {
      return 'free'; // Trial period
    }
  }
  
  return 'free';
}

// Get user's total tokens purchased (for basic tier lifetime limit)
export async function getUserTotalTokensPurchased(): Promise<number> {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return 0;
  
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('total_tokens_purchased')
    .eq('user_id', session.user.id)
    .single();
  
  return subscription?.total_tokens_purchased || 0;
}

// Check if user can access a specific feature
export async function checkFeatureAccess(
  feature: 'telegram' | 'custom_templates' | 'custom_branding' | 'api' | 'buy_tokens'
): Promise<{ allowed: boolean; reason?: string; upgradeTo?: SubscriptionTier }> {
  const userTier = await getUserSubscriptionTier();
  const allowed = canPerformAction(userTier, feature as any);
  
  if (!allowed) {
    const recommendation = getUpgradeRecommendation(userTier, feature as any);
    return {
      allowed: false,
      reason: `This feature requires a ${recommendation?.recommended || 'higher'} subscription`,
      upgradeTo: recommendation?.recommended
    };
  }
  
  return { allowed: true };
}

// Check if user can buy tokens
export async function checkTokenPurchaseAccess(): Promise<{ 
  allowed: boolean; 
  reason?: string; 
  upgradeTo?: SubscriptionTier;
  remainingAllowance?: number;
}> {
  const userTier = await getUserSubscriptionTier();
  const totalPurchased = await getUserTotalTokensPurchased();
  
  const allowed = canBuyTokens(userTier, totalPurchased);
  
  if (!allowed) {
    if (userTier === 'free') {
      return {
        allowed: false,
        reason: 'Free users cannot purchase tokens. Upgrade to Basic or higher to buy tokens.',
        upgradeTo: 'basic'
      };
    }
    
    if (userTier === 'basic') {
      const remaining = SUBSCRIPTION_FEATURES.basic.maxTokens - totalPurchased;
      return {
        allowed: false,
        reason: `Basic tier is limited to ${SUBSCRIPTION_FEATURES.basic.maxTokens} tokens lifetime. You've used ${totalPurchased}. Upgrade to Pro for unlimited tokens.`,
        upgradeTo: 'pro',
        remainingAllowance: remaining
      };
    }
  }
  
  return { 
    allowed: true,
    remainingAllowance: userTier === 'basic' ? SUBSCRIPTION_FEATURES.basic.maxTokens - totalPurchased : -1
  };
}

// Check contact limits
export async function checkContactLimit(): Promise<{ 
  allowed: boolean; 
  reason?: string; 
  upgradeTo?: SubscriptionTier;
  currentCount: number;
  maxCount: number;
}> {
  const supabase = createServerComponentClient({ cookies });
  const userTier = await getUserSubscriptionTier();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { allowed: false, reason: 'Not authenticated', currentCount: 0, maxCount: 0 };
  }
  
  // Get current contact count
  const { count } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id);
  
  const currentCount = count || 0;
  const maxCount = SUBSCRIPTION_FEATURES[userTier].maxContacts;
  const allowed = !hasReachedContactLimit(userTier, currentCount);
  
  if (!allowed) {
    const recommendation = getUpgradeRecommendation(userTier, 'contacts');
    return {
      allowed: false,
      reason: `Contact limit reached (${currentCount}/${maxCount}). Upgrade for more contacts.`,
      upgradeTo: recommendation?.recommended,
      currentCount,
      maxCount
    };
  }
  
  return { allowed: true, currentCount, maxCount };
}

// Check event limits
export async function checkEventLimit(): Promise<{ 
  allowed: boolean; 
  reason?: string; 
  upgradeTo?: SubscriptionTier;
  currentCount: number;
  maxCount: number;
}> {
  const supabase = createServerComponentClient({ cookies });
  const userTier = await getUserSubscriptionTier();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { allowed: false, reason: 'Not authenticated', currentCount: 0, maxCount: 0 };
  }
  
  // Get current event count
  const { count } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id);
  
  const currentCount = count || 0;
  const maxCount = SUBSCRIPTION_FEATURES[userTier].maxEvents;
  const allowed = !hasReachedEventLimit(userTier, currentCount);
  
  if (!allowed) {
    const recommendation = getUpgradeRecommendation(userTier, 'events');
    return {
      allowed: false,
      reason: `Event limit reached (${currentCount}/${maxCount}). Upgrade for more events.`,
      upgradeTo: recommendation?.recommended,
      currentCount,
      maxCount
    };
  }
  
  return { allowed: true, currentCount, maxCount };
}

// Redirect to upgrade page if feature access is denied
export async function requireFeatureAccess(
  feature: 'telegram' | 'custom_templates' | 'custom_branding' | 'api' | 'buy_tokens',
  redirectTo: string = '/pricing'
) {
  const access = await checkFeatureAccess(feature);
  
  if (!access.allowed) {
    redirect(redirectTo);
  }
  
  return access;
}

// Get user's subscription info for display
export async function getUserSubscriptionInfo() {
  const userTier = await getUserSubscriptionTier();
  const totalPurchased = await getUserTotalTokensPurchased();
  const features = SUBSCRIPTION_FEATURES[userTier];
  
  return {
    tier: userTier,
    features,
    totalTokensPurchased: totalPurchased,
    canBuyTokens: canBuyTokens(userTier, totalPurchased),
    remainingTokenAllowance: userTier === 'basic' ? features.maxTokens - totalPurchased : -1
  };
} 