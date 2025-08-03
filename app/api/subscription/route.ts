import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { SubscriptionTier, SUBSCRIPTION_FEATURES } from "@/lib/subscription"
import { checkSubscriptionOperation, checkRateLimit, logSubscriptionSecurityEvent } from "@/lib/subscription-security"
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

// Redirect to Stripe checkout for subscription creation
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

    // Rate limiting
    if (!checkRateLimit(session.user.id, 'subscription_creation', 3, 60000)) {
      return new NextResponse(
        JSON.stringify({ error: "Too many subscription attempts. Please wait before trying again." }),
        { 
          status: 429,
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

    // Security check - prevent direct subscription creation
    const securityCheck = await checkSubscriptionOperation(session.user.id, 'create')
    if (!securityCheck.isAllowed) {
      logSubscriptionSecurityEvent(session.user.id, 'blocked_direct_creation', { tier })
      return new NextResponse(
        JSON.stringify({ error: securityCheck.error || "Direct subscription creation not allowed" }),
        { 
          status: 403,
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
      return new NextResponse(
        JSON.stringify({ error: "Price not configured for this tier" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Check if user already has a subscription
    const { data: existingSubscription } = await supabase
      .from("user_subscriptions")
      .select("tier, current_period_start, current_period_end, id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single()

    let customerId: string | null = null
    let isUpgrade = false

    if (!existingSubscription) {
      // Create Stripe customer for new subscription
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          user_id: session.user.id,
        },
      })
      customerId = customer.id
    } else if (existingSubscription.tier !== tier) {
      // This is a plan change
      isUpgrade = isPlanUpgrade(existingSubscription.tier as SubscriptionTier, tier as SubscriptionTier)
      
      // For upgrades, we'll handle this in the webhook
      // Since we don't store stripe_subscription_id, we can't verify here
    }

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sunrise-2025.com'

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
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
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
    })

    logSubscriptionSecurityEvent(session.user.id, 'checkout_session_created', { tier, isUpgrade })

    return new NextResponse(
      JSON.stringify({ 
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
        isUpgrade
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("Error creating subscription checkout session:", error)
    
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
  const priceIds: Record<string, string | undefined> = {
    basic: process.env.STRIPE_BASIC_PRICE_ID,
    pro: process.env.STRIPE_PRO_PRICE_ID,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  }
  
  return priceIds[tier] || null
}

// Helper function to check if this is a plan upgrade
function isPlanUpgrade(fromTier: SubscriptionTier, toTier: SubscriptionTier): boolean {
  const tierOrder = ['free', 'basic', 'pro', 'enterprise']
  const fromIndex = tierOrder.indexOf(fromTier)
  const toIndex = tierOrder.indexOf(toTier)
  return toIndex > fromIndex
} 