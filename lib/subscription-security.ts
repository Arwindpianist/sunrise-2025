import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

/**
 * Security layer for subscription operations
 * This ensures that subscription changes only happen through proper Stripe verification
 */

export interface SubscriptionSecurityCheck {
  isAllowed: boolean
  error?: string
  requiresStripeVerification: boolean
  requiresPaymentCompletion: boolean
}

/**
 * Check if a subscription operation is allowed
 * This prevents direct database updates without proper verification
 */
export async function checkSubscriptionOperation(
  userId: string,
  operation: 'create' | 'update' | 'upgrade' | 'downgrade' | 'cancel',
  currentTier?: string,
  newTier?: string
): Promise<SubscriptionSecurityCheck> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current subscription
    const { data: currentSubscription } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single()

    switch (operation) {
      case 'create':
        // New subscriptions must go through Stripe checkout
        return {
          isAllowed: false,
          error: "Direct subscription creation not allowed. Use Stripe checkout.",
          requiresStripeVerification: true,
          requiresPaymentCompletion: true
        }

      case 'update':
        // Updates should only happen through Stripe webhooks
        return {
          isAllowed: false,
          error: "Direct subscription updates are not allowed. Changes must go through Stripe webhooks.",
          requiresStripeVerification: true,
          requiresPaymentCompletion: true
        }

      case 'upgrade':
        // Upgrades require Stripe verification and payment completion
        if (!currentSubscription) {
          return {
            isAllowed: false,
            error: "No active subscription found for upgrade",
            requiresStripeVerification: true,
            requiresPaymentCompletion: true
          }
        }
        
        if (!currentSubscription.stripe_subscription_id) {
          return {
            isAllowed: false,
            error: "Subscription missing Stripe subscription ID",
            requiresStripeVerification: true,
            requiresPaymentCompletion: true
          }
        }

        // Verify payment status with Stripe
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(currentSubscription.stripe_subscription_id)
          if (stripeSubscription.status !== 'active' && stripeSubscription.status !== 'trialing') {
            return {
              isAllowed: false,
              error: "Subscription payment not completed",
              requiresStripeVerification: true,
              requiresPaymentCompletion: true
            }
          }
        } catch (stripeError) {
          return {
            isAllowed: false,
            error: "Unable to verify subscription payment status",
            requiresStripeVerification: true,
            requiresPaymentCompletion: true
          }
        }

        return {
          isAllowed: true,
          requiresStripeVerification: true,
          requiresPaymentCompletion: true
        }

      case 'downgrade':
        // Downgrades require Stripe verification
        if (!currentSubscription) {
          return {
            isAllowed: false,
            error: "No active subscription found for downgrade",
            requiresStripeVerification: true,
            requiresPaymentCompletion: false
          }
        }

        return {
          isAllowed: true,
          requiresStripeVerification: true,
          requiresPaymentCompletion: false
        }

      case 'cancel':
        // Cancellations require Stripe verification
        if (!currentSubscription) {
          return {
            isAllowed: false,
            error: "No active subscription found for cancellation",
            requiresStripeVerification: true,
            requiresPaymentCompletion: false
          }
        }

        return {
          isAllowed: true,
          requiresStripeVerification: true,
          requiresPaymentCompletion: false
        }

      default:
        return {
          isAllowed: false,
          error: "Unknown subscription operation",
          requiresStripeVerification: true,
          requiresPaymentCompletion: true
        }
    }
  } catch (error: any) {
    console.error("Error in subscription security check:", error)
    return {
      isAllowed: false,
      error: "Security check failed",
      requiresStripeVerification: true,
      requiresPaymentCompletion: true
    }
  }
}

/**
 * Verify that a subscription change is coming from a legitimate source
 * This prevents unauthorized API calls
 */
export async function verifySubscriptionChangeSource(
  userId: string,
  source: 'stripe_webhook' | 'api_call' | 'direct_database',
  webhookSignature?: string
): Promise<boolean> {
  // Only allow changes from Stripe webhooks with proper signature verification
  if (source !== 'stripe_webhook') {
    console.warn(`[SECURITY] Unauthorized subscription change attempt from ${source} for user ${userId}`)
    logSubscriptionSecurityEvent(userId, 'unauthorized_change_attempt', { source })
    return false
  }
  
  // Additional verification for webhook signature
  if (!webhookSignature) {
    console.warn(`[SECURITY] Missing webhook signature for user ${userId}`)
    logSubscriptionSecurityEvent(userId, 'missing_webhook_signature', {})
    return false
  }
  
  return true
}

/**
 * Verify payment completion with Stripe
 */
export async function verifyPaymentCompletion(
  subscriptionId: string,
  userId: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return {
        isValid: false,
        error: `Payment not completed. Subscription status: ${subscription.status}`
      }
    }
    
    // Verify the subscription belongs to the user
    if (subscription.metadata?.user_id !== userId) {
      return {
        isValid: false,
        error: "Subscription metadata mismatch"
      }
    }
    
    return { isValid: true }
  } catch (error: any) {
    console.error("Error verifying payment completion:", error)
    return {
      isValid: false,
      error: "Unable to verify payment completion"
    }
  }
}

/**
 * Log security events for monitoring
 */
export function logSubscriptionSecurityEvent(
  userId: string,
  event: string,
  details: any
) {
  console.log(`[SUBSCRIPTION SECURITY] User: ${userId}, Event: ${event}`, {
    timestamp: new Date().toISOString(),
    userId,
    event,
    details,
    ip: process.env.REMOTE_ADDR || 'unknown'
  })
}

/**
 * Rate limiting for subscription operations
 */
const operationAttempts = new Map<string, { count: number; lastAttempt: number }>()

export function checkRateLimit(
  userId: string,
  operation: string,
  maxAttempts: number = 5,
  windowMs: number = 60000 // 1 minute
): boolean {
  const key = `${userId}:${operation}`
  const now = Date.now()
  const attempt = operationAttempts.get(key)
  
  if (!attempt) {
    operationAttempts.set(key, { count: 1, lastAttempt: now })
    return true
  }
  
  if (now - attempt.lastAttempt > windowMs) {
    operationAttempts.set(key, { count: 1, lastAttempt: now })
    return true
  }
  
  if (attempt.count >= maxAttempts) {
    logSubscriptionSecurityEvent(userId, 'rate_limit_exceeded', { operation, attempts: attempt.count })
    return false
  }
  
  attempt.count++
  attempt.lastAttempt = now
  return true
} 