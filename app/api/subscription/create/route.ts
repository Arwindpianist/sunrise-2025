import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { SubscriptionTier, SUBSCRIPTION_FEATURES } from "@/lib/subscription"
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

    // Check if user already has a Stripe customer
    const { data: existingSubscription } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, id")
      .eq("user_id", session.user.id)
      .single()

    let customerId = existingSubscription?.stripe_customer_id

    if (!customerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          user_id: session.user.id,
        },
      })
      customerId = customer.id
    }

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sunrise-2025.com'

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/dashboard/balance?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: {
        user_id: session.user.id,
        plan: tier,
      },
      subscription_data: {
        metadata: {
          user_id: session.user.id,
          plan: tier,
        },
      },
    })

    return new NextResponse(
      JSON.stringify({ 
        sessionId: checkoutSession.id,
        url: checkoutSession.url 
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