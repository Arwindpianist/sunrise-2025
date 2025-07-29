import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { SubscriptionTier, SUBSCRIPTION_FEATURES } from "@/lib/subscription"
import { getPlanChangeInfo, isPlanUpgrade } from "@/lib/billing-utils"
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export const dynamic = "force-dynamic"

// Create a Stripe checkout session for subscription
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

    // Get user's email for Stripe customer creation
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData?.email) {
      return new NextResponse(
        JSON.stringify({ error: "User email not found" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Get the price ID for the selected tier
    const priceId = getPriceIdForTier(tier as SubscriptionTier)
    if (!priceId) {
      console.error(`Price ID not found for tier: ${tier}`)
      console.error('Available environment variables:', {
        STRIPE_BASIC_PRICE_ID: !!process.env.STRIPE_BASIC_PRICE_ID,
        STRIPE_PRO_PRICE_ID: !!process.env.STRIPE_PRO_PRICE_ID,
        STRIPE_ENTERPRISE_PRICE_ID: !!process.env.STRIPE_ENTERPRISE_PRICE_ID,
      })
      return new NextResponse(
        JSON.stringify({ error: `Price not configured for ${tier} tier. Please check environment variables.` }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Check if user already has a subscription
    const { data: existingSubscription } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, tier, current_period_start, current_period_end, id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single()

    let customerId = existingSubscription?.stripe_customer_id
    let isUpgrade = false
    let planChangeInfo = null

    if (!customerId) {
      // Create Stripe customer for new subscription
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          user_id: session.user.id,
        },
      })
      customerId = customer.id
    } else if (existingSubscription && existingSubscription.tier !== tier) {
      // This is a plan change
      isUpgrade = isPlanUpgrade(existingSubscription.tier as SubscriptionTier, tier as SubscriptionTier)
      planChangeInfo = getPlanChangeInfo(
        existingSubscription.tier as SubscriptionTier,
        tier as SubscriptionTier,
        existingSubscription.current_period_start,
        existingSubscription.current_period_end
      )
    }

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sunrise-2025.com'

    // Prepare checkout session parameters
    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      success_url: `${baseUrl}/dashboard/balance?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: {
        user_id: session.user.id,
        plan: tier,
        is_upgrade: isUpgrade.toString(),
        from_tier: existingSubscription?.tier || 'free',
      },
      subscription_data: {
        metadata: {
          user_id: session.user.id,
          plan: tier,
          is_upgrade: isUpgrade.toString(),
          from_tier: existingSubscription?.tier || 'free',
        },
      },
    }

    if (isUpgrade && existingSubscription?.stripe_subscription_id) {
      // Handle upgrade with proration - use subscription update instead
      // For upgrades, we'll handle this differently in the webhook
      checkoutParams.line_items = [
        {
          price: priceId,
          quantity: 1,
        },
      ]
    } else {
      // New subscription or downgrade
      checkoutParams.line_items = [
        {
          price: priceId,
          quantity: 1,
        },
      ]
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create(checkoutParams)

    return new NextResponse(
      JSON.stringify({ 
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
        isUpgrade,
        planChangeInfo
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("Error creating subscription checkout session:", error)
    
    // Return more specific error messages
    let errorMessage = "Internal server error"
    if (error.type === 'StripeInvalidRequestError') {
      errorMessage = `Stripe error: ${error.message}`
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return new NextResponse(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

// Helper function to get Stripe price ID for each tier
function getPriceIdForTier(tier: SubscriptionTier): string | null {
  // You need to create these price IDs in your Stripe dashboard
  // and replace them with your actual price IDs
  const priceIds: Record<string, string | undefined> = {
    basic: process.env.STRIPE_BASIC_PRICE_ID,
    pro: process.env.STRIPE_PRO_PRICE_ID,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  }
  
  return priceIds[tier] || null
} 