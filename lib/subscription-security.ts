import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

/**
 * Security layer for subscription operations
 * This ensures that subscription changes only happen through proper Stripe verification
 */

export interface SubscriptionSecurityCheck {
  isAllowed: boolean
  error?: string
  requiresStripeVerification: boolean
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
        // New subscriptions are always allowed (they go through Stripe checkout)
        return {
          isAllowed: true,
          requiresStripeVerification: true
        }

      case 'update':
        // Updates should only happen through Stripe webhooks
        return {
          isAllowed: false,
          error: "Direct subscription updates are not allowed. Changes must go through Stripe.",
          requiresStripeVerification: true
        }

      case 'upgrade':
        // Upgrades require Stripe verification
        if (!currentSubscription) {
          return {
            isAllowed: false,
            error: "No active subscription found for upgrade",
            requiresStripeVerification: true
          }
        }
        
        if (!currentSubscription.stripe_subscription_id) {
          return {
            isAllowed: false,
            error: "Subscription missing Stripe subscription ID",
            requiresStripeVerification: true
          }
        }

        return {
          isAllowed: true,
          requiresStripeVerification: true
        }

      case 'downgrade':
        // Downgrades require Stripe verification
        if (!currentSubscription) {
          return {
            isAllowed: false,
            error: "No active subscription found for downgrade",
            requiresStripeVerification: true
          }
        }

        return {
          isAllowed: true,
          requiresStripeVerification: true
        }

      case 'cancel':
        // Cancellations require Stripe verification
        if (!currentSubscription) {
          return {
            isAllowed: false,
            error: "No active subscription found for cancellation",
            requiresStripeVerification: true
          }
        }

        return {
          isAllowed: true,
          requiresStripeVerification: true
        }

      default:
        return {
          isAllowed: false,
          error: "Unknown subscription operation",
          requiresStripeVerification: true
        }
    }
  } catch (error: any) {
    console.error("Error in subscription security check:", error)
    return {
      isAllowed: false,
      error: "Security check failed",
      requiresStripeVerification: true
    }
  }
}

/**
 * Verify that a subscription change is coming from a legitimate source
 * This prevents unauthorized API calls
 */
export async function verifySubscriptionChangeSource(
  userId: string,
  source: 'stripe_webhook' | 'api_call' | 'direct_database'
): Promise<boolean> {
  // Only allow changes from Stripe webhooks
  if (source !== 'stripe_webhook') {
    console.warn(`[SECURITY] Unauthorized subscription change attempt from ${source} for user ${userId}`)
    return false
  }
  
  return true
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
    details
  })
} 