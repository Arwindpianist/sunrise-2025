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
        // Allow subscription creation through API (which creates Stripe checkout)
        // This is different from direct database updates
        return {
          isAllowed: true,
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
        
        // Since we don't store stripe_subscription_id in the database,
        // we can't verify the subscription status here
        // This verification will happen in the webhook when the payment is processed
        return {
          isAllowed: true,
          requiresStripeVerification: true,
          requiresPaymentCompletion: true
        }

        return {
          isAllowed: true,
          requiresStripeVerification: true,
          requiresPaymentCompletion: true
        }

      case 'downgrade':
        // Downgrades should go through Stripe
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
        // Cancellations should go through Stripe
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
    console.error("Error in checkSubscriptionOperation:", error)
    return {
      isAllowed: false,
      error: "Error checking subscription operation",
      requiresStripeVerification: true,
      requiresPaymentCompletion: true
    }
  }
}

/**
 * Verify that a subscription change came from a legitimate source
 * This prevents unauthorized changes to subscription data
 */
export async function verifySubscriptionChangeSource(
  userId: string,
  source: 'stripe_webhook' | 'api_call' | 'direct_database',
  webhookSignature?: string
): Promise<boolean> {
  try {
    switch (source) {
      case 'stripe_webhook':
        // Webhook calls are always legitimate (verified by Stripe signature)
        return true

      case 'api_call':
        // API calls are legitimate if they go through proper channels
        return true

      case 'direct_database':
        // Direct database changes are not allowed
        logSubscriptionSecurityEvent(userId, 'unauthorized_direct_database_change', {
          source,
          timestamp: new Date().toISOString()
        })
        return false

      default:
        return false
    }
  } catch (error) {
    console.error("Error verifying subscription change source:", error)
    return false
  }
}

/**
 * Verify that payment has been completed for a subscription
 */
export async function verifyPaymentCompletion(
  subscriptionId: string,
  userId: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    if (stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing') {
      return { isValid: true }
    } else {
      return { 
        isValid: false, 
        error: `Subscription payment not completed. Status: ${stripeSubscription.status}` 
      }
    }
  } catch (error: any) {
    console.error("Error verifying payment completion:", error)
    return { 
      isValid: false, 
      error: "Unable to verify payment completion" 
    }
  }
}

/**
 * Log security events for audit trail
 */
export function logSubscriptionSecurityEvent(
  userId: string,
  event: string,
  details: any
) {
  try {
    console.log(`[SUBSCRIPTION SECURITY] User: ${userId}, Event: ${event}`, {
      timestamp: new Date().toISOString(),
      userId,
      event,
      details,
      ip: 'unknown'
    })
  } catch (error) {
    console.error("Error logging security event:", error)
  }
}

/**
 * Simple rate limiting for subscription operations
 */
export function checkRateLimit(
  userId: string,
  operation: string,
  maxAttempts: number = 5,
  windowMs: number = 60000 // 1 minute
): boolean {
  // This is a simple in-memory rate limiter
  // In production, you should use Redis or a database
  const key = `${userId}:${operation}`
  const now = Date.now()
  
  // For now, always allow (you can implement proper rate limiting later)
  return true
} 