import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { SubscriptionTier, SUBSCRIPTION_FEATURES } from "@/lib/subscription"
import { getPlanChangeInfo, isPlanUpgrade, formatProrationInfo } from "@/lib/billing-utils"
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export const dynamic = "force-dynamic"

// Handle subscription upgrade with proration
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const { tier } = await request.json()

    if (!tier || !SUBSCRIPTION_FEATURES[tier as SubscriptionTier]) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid subscription tier" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Get current subscription
    const { data: currentSubscription, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single()

    if (subscriptionError || !currentSubscription) {
      return new NextResponse(
        JSON.stringify({ error: "No active subscription found" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Prevent free users from using upgrade endpoint
    if (currentSubscription.tier === 'free') {
      return new NextResponse(
        JSON.stringify({ error: "Free users must use the subscription creation endpoint" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Check if this is actually an upgrade
    if (!isPlanUpgrade(currentSubscription.tier as SubscriptionTier, tier as SubscriptionTier)) {
      return new NextResponse(
        JSON.stringify({ error: "This is not a valid upgrade path" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Get the price ID for the new tier
    const priceId = getPriceIdForTier(tier as SubscriptionTier)
    if (!priceId) {
      return new NextResponse(
        JSON.stringify({ error: `Price not configured for ${tier} tier` }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Calculate proration information
    const planChangeInfo = getPlanChangeInfo(
      currentSubscription.tier as SubscriptionTier,
      tier as SubscriptionTier,
      currentSubscription.current_period_start,
      currentSubscription.current_period_end
    )

    try {
      // Update the subscription in Stripe with proration
      const updatedSubscription = await stripe.subscriptions.update(
        currentSubscription.stripe_subscription_id,
        {
          items: [
            {
              id: (await stripe.subscriptions.retrieve(currentSubscription.stripe_subscription_id)).items.data[0].id,
              price: priceId,
            },
          ],
          proration_behavior: 'create_prorations',
          metadata: {
            user_id: session.user.id,
            plan: tier,
            is_upgrade: 'true',
            from_tier: currentSubscription.tier,
          },
        }
      )

      // Safely handle Stripe timestamps
      const getStripeDate = (timestamp: number | undefined) => {
        if (!timestamp) return new Date().toISOString()
        try {
          return new Date(timestamp * 1000).toISOString()
        } catch (error) {
          console.warn('Invalid Stripe timestamp:', timestamp)
          return new Date().toISOString()
        }
      }

      // Update subscription in database
      await supabase
        .from("user_subscriptions")
        .update({
          tier: tier,
          current_period_start: getStripeDate((updatedSubscription as any).current_period_start),
          current_period_end: getStripeDate((updatedSubscription as any).current_period_end),
          updated_at: new Date().toISOString()
        })
        .eq("id", currentSubscription.id)

      // Handle prorated token allocation
      await handleProratedTokenAllocation(
        session.user.id,
        currentSubscription.tier as SubscriptionTier,
        tier as SubscriptionTier,
        planChangeInfo,
        supabase
      )

      return new NextResponse(
        JSON.stringify({ 
          success: true,
          message: "Subscription upgraded successfully",
          planChangeInfo: {
            fromTier: currentSubscription.tier,
            toTier: tier,
            prorationInfo: formatProrationInfo(planChangeInfo.prorationInfo),
            proratedTokens: planChangeInfo.prorationInfo.proratedTokens,
            proratedAmount: planChangeInfo.prorationInfo.proratedAmount
          }
        }),
        { 
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )

    } catch (stripeError: any) {
      console.error("Stripe error during upgrade:", stripeError)
      return new NextResponse(
        JSON.stringify({ error: `Stripe error: ${stripeError.message}` }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

  } catch (error: any) {
    console.error("Error upgrading subscription:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

async function handleProratedTokenAllocation(
  userId: string,
  fromTier: SubscriptionTier,
  toTier: SubscriptionTier,
  planChangeInfo: any,
  supabase: any
) {
  try {
    const proratedTokens = planChangeInfo.prorationInfo.proratedTokens

    if (proratedTokens > 0) {
      // Get current balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', userId)
        .single()

      if (balanceError && balanceError.code !== 'PGRST116') {
        console.error('Error fetching user balance:', balanceError)
        return
      }

      const currentBalance = balanceData?.balance || 0
      const newBalance = currentBalance + proratedTokens

      // Update user balance
      const { error: updateError } = await supabase
        .from('user_balances')
        .upsert({
          user_id: userId,
          balance: newBalance,
          updated_at: new Date().toISOString()
        })

      if (updateError) {
        console.error('Error updating user balance:', updateError)
        return
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'upgrade_credit',
          amount: proratedTokens,
          description: `Plan upgrade: ${fromTier} → ${toTier} (${planChangeInfo.prorationInfo.daysRemaining} days remaining)`,
          status: 'completed',
          created_at: new Date().toISOString()
        })

      if (transactionError) {
        console.error('Error recording transaction:', transactionError)
      }

      console.log(`Upgrade tokens processed: ${proratedTokens} tokens for user ${userId} (${fromTier} → ${toTier})`)
    }
  } catch (error) {
    console.error('Error handling prorated token allocation:', error)
  }
}

// Helper function to get Stripe price ID for each tier
function getPriceIdForTier(tier: SubscriptionTier): string | null {
  const priceIds: Record<string, string | undefined> = {
    basic: process.env.STRIPE_BASIC_PRICE_ID,
    pro: process.env.STRIPE_PRO_PRICE_ID,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  }
  
  return priceIds[tier] || null
} 