import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SubscriptionTier, SUBSCRIPTION_FEATURES } from './subscription'

// Get user's subscription tier from database
async function getUserSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  
  try {
    // Check for active subscription
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('tier, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!error && subscription) {
      return subscription.tier as SubscriptionTier
    }

    // Check for any subscription
    const { data: anySubscription } = await supabase
      .from('user_subscriptions')
      .select('tier, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (anySubscription) {
      return anySubscription.tier as SubscriptionTier
    }

    return 'free'
  } catch (error) {
    console.error('Error getting user subscription tier:', error)
    return 'free'
  }
}

// Check if user can perform a specific action
export async function checkSubscriptionLimit(
  userId: string,
  action: 'create_contact' | 'create_event' | 'use_telegram' | 'customize_templates' | 'use_api'
): Promise<{ allowed: boolean; reason?: string; tier: SubscriptionTier }> {
  const tier = await getUserSubscriptionTier(userId)
  const features = SUBSCRIPTION_FEATURES[tier]

  switch (action) {
    case 'create_contact':
      return {
        allowed: features.maxContacts === -1,
        reason: features.maxContacts === -1 ? undefined : `Contact limit: ${features.maxContacts}`,
        tier
      }
    
    case 'create_event':
      return {
        allowed: features.maxEvents === -1,
        reason: features.maxEvents === -1 ? undefined : `Event limit: ${features.maxEvents}`,
        tier
      }
    
    case 'use_telegram':
      return {
        allowed: features.canUseTelegram,
        reason: features.canUseTelegram ? undefined : 'Telegram not available for your plan',
        tier
      }
    
    case 'customize_templates':
      return {
        allowed: features.canCustomizeTemplates,
        reason: features.canCustomizeTemplates ? undefined : 'Template customization not available for your plan',
        tier
      }
    
    case 'use_api':
      return {
        allowed: features.canUseAPI,
        reason: features.canUseAPI ? undefined : 'API access not available for your plan',
        tier
      }
    
    default:
      return { allowed: false, reason: 'Unknown action', tier }
  }
}

// Middleware function to check limits before API calls
export async function withSubscriptionCheck(
  request: Request,
  action: 'create_contact' | 'create_event' | 'use_telegram' | 'customize_templates' | 'use_api'
) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limitCheck = await checkSubscriptionLimit(session.user.id, action)
  
  if (!limitCheck.allowed) {
    return NextResponse.json({
      error: `Action not allowed: ${limitCheck.reason}`,
      tier: limitCheck.tier,
      action
    }, { status: 403 })
  }

  return null // Continue with the request
} 