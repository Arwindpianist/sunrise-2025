import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Stripe from 'stripe'
import { logSubscriptionSecurityEvent } from "./subscription-security"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export interface SubscriptionVerificationResult {
  isValid: boolean
  error?: string
  subscription?: any
  stripeSubscription?: Stripe.Subscription
  requiresPayment?: boolean
}

/**
 * Verify that a user's subscription is valid and active
 * This ensures that subscription changes only happen through proper Stripe verification
 */
export async function verifyUserSubscription(userId: string): Promise<SubscriptionVerificationResult> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user's subscription from database
    const { data: subscription, error: dbError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single()

    if (dbError || !subscription) {
      logSubscriptionSecurityEvent(userId, 'no_active_subscription', {})
      return {
        isValid: false,
        error: "No active subscription found"
      }
    }

    // Verify subscription has a Stripe subscription ID
    if (!subscription.stripe_subscription_id) {
      logSubscriptionSecurityEvent(userId, 'missing_stripe_id', { subscriptionId: subscription.id })
      return {
        isValid: false,
        error: "Subscription missing Stripe subscription ID"
      }
    }

    // Verify the subscription exists in Stripe and is active
    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
      
      if (stripeSubscription.status !== 'active' && stripeSubscription.status !== 'trialing') {
        logSubscriptionSecurityEvent(userId, 'inactive_stripe_subscription', { 
          status: stripeSubscription.status,
          subscriptionId: subscription.stripe_subscription_id
        })
        return {
          isValid: false,
          error: `Subscription status is ${stripeSubscription.status}, not active`,
          subscription,
          stripeSubscription,
          requiresPayment: stripeSubscription.status === 'past_due' || stripeSubscription.status === 'unpaid'
        }
      }

      // Verify metadata matches
      if (stripeSubscription.metadata?.user_id !== userId) {
        logSubscriptionSecurityEvent(userId, 'metadata_mismatch', { 
          stripeUserId: stripeSubscription.metadata?.user_id,
          expectedUserId: userId
        })
        return {
          isValid: false,
          error: "Subscription metadata mismatch",
          subscription,
          stripeSubscription
        }
      }

      // Verify the tier matches
      if (stripeSubscription.metadata?.plan !== subscription.tier) {
        logSubscriptionSecurityEvent(userId, 'tier_mismatch', { 
          stripeTier: stripeSubscription.metadata?.plan,
          dbTier: subscription.tier
        })
        return {
          isValid: false,
          error: "Subscription tier mismatch between Stripe and database",
          subscription,
          stripeSubscription
        }
      }

      return {
        isValid: true,
        subscription,
        stripeSubscription
      }
    } catch (stripeError: any) {
      console.error("Error verifying Stripe subscription:", stripeError)
      logSubscriptionSecurityEvent(userId, 'stripe_verification_error', { error: stripeError.message })
      return {
        isValid: false,
        error: "Unable to verify subscription with Stripe",
        subscription
      }
    }
  } catch (error: any) {
    console.error("Error in subscription verification:", error)
    logSubscriptionSecurityEvent(userId, 'verification_error', { error: error.message })
    return {
      isValid: false,
      error: "Internal verification error"
    }
  }
}

/**
 * Verify that a subscription change is legitimate
 * This prevents unauthorized subscription modifications
 */
export async function verifySubscriptionChange(
  userId: string, 
  newTier: string, 
  currentTier: string
): Promise<SubscriptionVerificationResult> {
  try {
    const verification = await verifyUserSubscription(userId)
    
    if (!verification.isValid) {
      return verification
    }

    // Additional checks for subscription changes
    if (verification.subscription && verification.stripeSubscription) {
      // Verify the subscription metadata matches
      const metadata = verification.stripeSubscription.metadata
      if (metadata.user_id !== userId) {
        logSubscriptionSecurityEvent(userId, 'change_metadata_mismatch', { 
          metadataUserId: metadata.user_id,
          expectedUserId: userId
        })
        return {
          isValid: false,
          error: "Subscription metadata mismatch",
          subscription: verification.subscription,
          stripeSubscription: verification.stripeSubscription
        }
      }

      // Verify the current tier matches
      if (verification.subscription.tier !== currentTier) {
        logSubscriptionSecurityEvent(userId, 'change_tier_mismatch', { 
          currentTier: verification.subscription.tier,
          expectedTier: currentTier
        })
        return {
          isValid: false,
          error: "Current tier mismatch",
          subscription: verification.subscription,
          stripeSubscription: verification.stripeSubscription
        }
      }

      // Verify the subscription is not in a problematic state
      if (verification.stripeSubscription.status === 'past_due' || 
          verification.stripeSubscription.status === 'unpaid') {
        logSubscriptionSecurityEvent(userId, 'change_payment_required', { 
          status: verification.stripeSubscription.status
        })
        return {
          isValid: false,
          error: "Payment required before subscription changes",
          subscription: verification.subscription,
          stripeSubscription: verification.stripeSubscription,
          requiresPayment: true
        }
      }
    }

    return verification
  } catch (error: any) {
    console.error("Error in subscription change verification:", error)
    logSubscriptionSecurityEvent(userId, 'change_verification_error', { error: error.message })
    return {
      isValid: false,
      error: "Internal verification error"
    }
  }
}

/**
 * Verify subscription access for feature usage
 */
export async function verifySubscriptionAccess(
  userId: string,
  feature: string
): Promise<SubscriptionVerificationResult> {
  try {
    const verification = await verifyUserSubscription(userId)
    
    if (!verification.isValid) {
      logSubscriptionSecurityEvent(userId, 'feature_access_denied', { 
        feature,
        reason: verification.error 
      })
      return verification
    }

    // Additional feature-specific checks can be added here
    logSubscriptionSecurityEvent(userId, 'feature_access_granted', { feature })
    return verification
  } catch (error: any) {
    console.error("Error in subscription access verification:", error)
    logSubscriptionSecurityEvent(userId, 'access_verification_error', { 
      feature,
      error: error.message 
    })
    return {
      isValid: false,
      error: "Internal verification error"
    }
  }
}

/**
 * Log subscription verification attempts for security monitoring
 */
export function logSubscriptionVerification(
  userId: string, 
  action: string, 
  result: SubscriptionVerificationResult,
  additionalData?: any
) {
  logSubscriptionSecurityEvent(userId, 'verification_attempt', {
    action,
    isValid: result.isValid,
    error: result.error,
    additionalData
  })
} 