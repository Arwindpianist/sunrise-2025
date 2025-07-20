import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { SubscriptionTier, SUBSCRIPTION_FEATURES } from "@/lib/subscription"
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export const dynamic = "force-dynamic"

// Get user's current subscription
export async function GET() {
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

    // Get user's subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single()

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error("Error fetching subscription:", subscriptionError)
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch subscription" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // If no active subscription, check if user is in trial period
    if (!subscription) {
      const { data: profile } = await supabase.auth.getUser()
      if (profile.user) {
        const createdAt = new Date(profile.user.created_at)
        const now = new Date()
        const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        
        // Only show trial if user has NO subscription at all (not just inactive)
        const { data: anySubscription } = await supabase
          .from("user_subscriptions")
          .select("tier, status")
          .eq("user_id", session.user.id)
          .single()
        
        if (!anySubscription && daysSinceCreation <= 30) {
          return new NextResponse(
            JSON.stringify({
              tier: "free",
              status: "trial",
              features: SUBSCRIPTION_FEATURES.free,
              trialDaysRemaining: Math.max(0, 30 - Math.floor(daysSinceCreation))
            }),
            { 
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        }
      }
      
      return new NextResponse(
        JSON.stringify({
          tier: "free",
          status: "inactive",
          features: SUBSCRIPTION_FEATURES.free
        }),
        { 
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    return new NextResponse(
      JSON.stringify({
        ...subscription,
        features: SUBSCRIPTION_FEATURES[subscription.tier as SubscriptionTier]
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("Error in subscription GET:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

// Create or update subscription with Stripe payment
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

    const { tier, paymentMethodId } = await request.json()

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
      .from('profiles')
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
      return new NextResponse(
        JSON.stringify({ error: "Price not configured for this tier" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Check if user already has a Stripe customer
    const { data: existingSubscription } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, total_tokens_purchased, id")
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

    // Create or update subscription in Stripe
    let stripeSubscription
    if (existingSubscription?.stripe_subscription_id) {
      // Update existing subscription
      stripeSubscription = await stripe.subscriptions.update(
        existingSubscription.stripe_subscription_id,
        {
          items: [{ price: priceId }],
          metadata: {
            user_id: session.user.id,
            plan: tier,
          },
        }
      )
    } else {
      // Create new subscription
      stripeSubscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          user_id: session.user.id,
          plan: tier,
        },
      })
    }

    // Update database with subscription info
    const now = new Date()
    const subscriptionData = {
      user_id: session.user.id,
      tier,
      status: 'active',
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSubscription.id,
      current_period_start: new Date((stripeSubscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((stripeSubscription as any).current_period_end * 1000).toISOString(),
      total_tokens_purchased: existingSubscription?.total_tokens_purchased || 0,
      updated_at: now.toISOString()
    }

    if (existingSubscription) {
      // Update existing subscription
      const { data: updatedSubscription, error: updateError } = await supabase
        .from("user_subscriptions")
        .update(subscriptionData)
        .eq("id", existingSubscription.id)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating subscription:", updateError)
        return new NextResponse(
          JSON.stringify({ error: "Failed to update subscription" }),
          { 
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        )
      }

      return new NextResponse(
        JSON.stringify({
          ...updatedSubscription,
          features: SUBSCRIPTION_FEATURES[tier as SubscriptionTier],
          clientSecret: (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret
        }),
        { 
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    } else {
      // Create new subscription
      const { data: newSubscription, error: createError } = await supabase
        .from("user_subscriptions")
        .insert({
          ...subscriptionData,
          created_at: now.toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating subscription:", createError)
        return new NextResponse(
          JSON.stringify({ error: "Failed to create subscription" }),
          { 
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        )
      }

      return new NextResponse(
        JSON.stringify({
          ...newSubscription,
          features: SUBSCRIPTION_FEATURES[tier as SubscriptionTier],
          clientSecret: (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret
        }),
        { 
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

  } catch (error: any) {
    console.error("Error in subscription POST:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
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