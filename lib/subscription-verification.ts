import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export interface SubscriptionVerificationResult {
  isValid: boolean
  error?: string
  subscription?: any
  stripeSubscription?: Stripe.Subscription
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
      return {
        isValid: false,
        error: "No active subscription found"
      }
    }

    // Verify subscription has a Stripe subscription ID
    if (!subscription.stripe_subscription_id) {
      return {
        isValid: false,
        error: "Subscription missing Stripe subscription ID"
      }
    }

    // Verify the subscription exists in Stripe and is active
    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
      
      if (stripeSubscription.status !== 'active' && stripeSubscription.status !== 'trialing') {
        return {
          isValid: false,
          error: `Subscription status is ${stripeSubscription.status}, not active`,
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
      return {
        isValid: false,
        error: "Unable to verify subscription with Stripe",
        subscription
      }
    }
  } catch (error: any) {
    console.error("Error in subscription verification:", error)
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
        return {
          isValid: false,
          error: "Subscription metadata mismatch",
          subscription: verification.subscription,
          stripeSubscription: verification.stripeSubscription
        }
      }

      // Verify the current tier matches
      if (verification.subscription.tier !== currentTier) {
        return {
          isValid: false,
          error: "Current tier mismatch",
          subscription: verification.subscription,
          stripeSubscription: verification.stripeSubscription
        }
      }
    }

    return verification
  } catch (error: any) {
    console.error("Error in subscription change verification:", error)
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
  console.log(`[SUBSCRIPTION VERIFICATION] User: ${userId}, Action: ${action}, Valid: ${result.isValid}, Error: ${result.error || 'None'}`, {
    timestamp: new Date().toISOString(),
    userId,
    action,
    isValid: result.isValid,
    error: result.error,
    additionalData
  })
} 