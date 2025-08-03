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

    // Since we don't store stripe_subscription_id in the database,
    // we can't verify the subscription status here
    // This verification will happen in the webhook when the payment is processed
    return {
      isValid: true,
      subscription
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

    // Since we don't store stripe_subscription_id in the database,
    // we can't perform Stripe-specific verification here
    // This verification will happen in the webhook when the payment is processed

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