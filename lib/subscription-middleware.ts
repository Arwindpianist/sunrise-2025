import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SubscriptionTier, SUBSCRIPTION_FEATURES } from './subscription'
import { verifyUserSubscription, verifySubscriptionAccess } from './subscription-verification'
import { logSubscriptionSecurityEvent } from './subscription-security'

// Get user's subscription tier from database with verification
async function getUserSubscriptionTier(userId: string): Promise<{ tier: SubscriptionTier; isValid: boolean; error?: string }> {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  
  try {
    // Verify subscription with Stripe
    const verification = await verifyUserSubscription(userId)
    
    if (!verification.isValid) {
      // Fallback to database check for free tier
      const { data: anySubscription } = await supabase
        .from('user_subscriptions')
        .select('tier, status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (anySubscription && anySubscription.status === 'active') {
        logSubscriptionSecurityEvent(userId, 'fallback_to_db_tier', { 
          tier: anySubscription.tier,
          reason: verification.error 
        })
        return { tier: anySubscription.tier as SubscriptionTier, isValid: false, error: verification.error }
      }

      return { tier: 'free', isValid: true }
    }

    return { tier: verification.subscription!.tier as SubscriptionTier, isValid: true }
  } catch (error) {
    console.error('Error getting user subscription tier:', error)
    logSubscriptionSecurityEvent(userId, 'tier_verification_error', { error: error.message })
    return { tier: 'free', isValid: false, error: 'Verification failed' }
  }
}

// Check if user can perform a specific action with enhanced security
export async function checkSubscriptionLimit(
  userId: string,
  action: 'create_contact' | 'create_event' | 'use_telegram' | 'customize_templates' | 'use_api'
): Promise<{ allowed: boolean; reason?: string; tier: SubscriptionTier; isValid: boolean }> {
  const { tier, isValid, error } = await getUserSubscriptionTier(userId)
  const features = SUBSCRIPTION_FEATURES[tier]

  // If subscription verification failed, deny access to premium features
  if (!isValid && tier !== 'free') {
    logSubscriptionSecurityEvent(userId, 'premium_access_denied_verification_failed', { 
      action, 
      tier, 
      error 
    })
    return {
      allowed: false,
      reason: `Subscription verification failed: ${error}. Please contact support.`,
      tier: 'free',
      isValid: false
    }
  }

  switch (action) {
    case 'create_contact':
      if (features.maxContacts === -1) {
        return { allowed: true, tier, isValid }
      }
      
      // Check actual contact count
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      const { count: contactCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (contactCount && contactCount >= features.maxContacts) {
        logSubscriptionSecurityEvent(userId, 'contact_limit_exceeded', { 
          current: contactCount, 
          limit: features.maxContacts 
        })
        return {
          allowed: false,
          reason: `Contact limit exceeded: ${contactCount}/${features.maxContacts}`,
          tier,
          isValid
        }
      }
      return { allowed: true, tier, isValid }
    
    case 'create_event':
      if (features.maxEvents === -1) {
        return { allowed: true, tier, isValid }
      }
      
      // Check actual event count
      const { count: eventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (eventCount && eventCount >= features.maxEvents) {
        logSubscriptionSecurityEvent(userId, 'event_limit_exceeded', { 
          current: eventCount, 
          limit: features.maxEvents 
        })
        return {
          allowed: false,
          reason: `Event limit exceeded: ${eventCount}/${features.maxEvents}`,
          tier,
          isValid
        }
      }
      return { allowed: true, tier, isValid }
    
    case 'use_telegram':
      if (!features.canUseTelegram) {
        logSubscriptionSecurityEvent(userId, 'telegram_access_denied', { tier })
        return {
          allowed: false,
          reason: 'Telegram not available for your plan',
          tier,
          isValid
        }
      }
      return { allowed: true, tier, isValid }
    
    case 'customize_templates':
      if (!features.canCustomizeTemplates) {
        logSubscriptionSecurityEvent(userId, 'template_customization_denied', { tier })
        return {
          allowed: false,
          reason: 'Template customization not available for your plan',
          tier,
          isValid
        }
      }
      return { allowed: true, tier, isValid }
    
    case 'use_api':
      if (!features.canUseAPI) {
        logSubscriptionSecurityEvent(userId, 'api_access_denied', { tier })
        return {
          allowed: false,
          reason: 'API access not available for your plan',
          tier,
          isValid
        }
      }
      return { allowed: true, tier, isValid }
    
    default:
      return { allowed: false, reason: 'Unknown action', tier, isValid: false }
  }
}

// Enhanced middleware function to check limits before API calls
export async function withSubscriptionCheck(
  request: Request,
  action: 'create_contact' | 'create_event' | 'use_telegram' | 'customize_templates' | 'use_api'
) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    logSubscriptionSecurityEvent('unknown', 'unauthorized_access_attempt', { action })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limitCheck = await checkSubscriptionLimit(session.user.id, action)
  
  if (!limitCheck.allowed) {
    logSubscriptionSecurityEvent(session.user.id, 'action_blocked', { 
      action, 
      reason: limitCheck.reason,
      tier: limitCheck.tier 
    })
    return NextResponse.json({
      error: `Action not allowed: ${limitCheck.reason}`,
      tier: limitCheck.tier,
      action,
      requiresUpgrade: limitCheck.tier === 'free' || !limitCheck.isValid
    }, { status: 403 })
  }

  return null // Continue with the request
}

// Check if user has sufficient balance for token-based operations
export async function checkUserBalance(
  userId: string,
  requiredTokens: number
): Promise<{ hasBalance: boolean; currentBalance: number; reason?: string }> {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  
  try {
    const { data: balanceData, error: balanceError } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('Error fetching user balance:', balanceError)
      return {
        hasBalance: false,
        currentBalance: 0,
        reason: 'Unable to verify balance'
      }
    }

    const currentBalance = balanceData?.balance || 0
    
    if (currentBalance < requiredTokens) {
      logSubscriptionSecurityEvent(userId, 'insufficient_balance', { 
        current: currentBalance, 
        required: requiredTokens 
      })
      return {
        hasBalance: false,
        currentBalance,
        reason: `Insufficient balance: ${currentBalance}/${requiredTokens} tokens`
      }
    }

    return {
      hasBalance: true,
      currentBalance
    }
  } catch (error) {
    console.error('Error checking user balance:', error)
    return {
      hasBalance: false,
      currentBalance: 0,
      reason: 'Balance check failed'
    }
  }
} 