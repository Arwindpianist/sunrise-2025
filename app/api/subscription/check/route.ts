import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

// Create a Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export const dynamic = "force-dynamic"

// Diagnostic endpoint to check and fix subscription status
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return new NextResponse(
        JSON.stringify({ error: "Session ID required" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Get the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (!checkoutSession) {
      return new NextResponse(
        JSON.stringify({ error: "Checkout session not found" }),
        { 
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Get current subscription from database
    const { data: currentSubscription, error: subscriptionError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    const result: any = {
      checkoutSession: {
        id: checkoutSession.id,
        status: checkoutSession.status,
        payment_status: checkoutSession.payment_status,
        subscription: checkoutSession.subscription,
        metadata: checkoutSession.metadata
      },
      currentSubscription: currentSubscription || null,
      subscriptionError: subscriptionError ? subscriptionError.message : null
    }

    // If payment was successful but subscription not updated, try to fix it
    if (checkoutSession.payment_status === 'paid' && checkoutSession.subscription) {
      const stripeSubscription = await stripe.subscriptions.retrieve(checkoutSession.subscription as string)
      
      if (stripeSubscription.status === 'active') {
        const plan = checkoutSession.metadata?.plan || 'basic'
        
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

        const subscriptionData = {
          user_id: session.user.id,
          tier: plan,
          status: 'active',
          stripe_subscription_id: stripeSubscription.id,
          current_period_start: getStripeDate((stripeSubscription as any).current_period_start),
          current_period_end: getStripeDate((stripeSubscription as any).current_period_end),
          updated_at: new Date().toISOString()
        }

        if (currentSubscription) {
          // Update existing subscription
          const { data: updatedSubscription, error: updateError } = await supabaseAdmin
            .from("user_subscriptions")
            .update(subscriptionData)
            .eq("id", currentSubscription.id)
            .select()
            .single()

          result.updatedSubscription = updatedSubscription
          result.updateError = updateError ? updateError.message : null
        } else {
          // Create new subscription
          const { data: newSubscription, error: createError } = await supabaseAdmin
            .from("user_subscriptions")
            .insert({
              ...subscriptionData,
              created_at: new Date().toISOString()
            })
            .select()
            .single()

          result.newSubscription = newSubscription
          result.createError = createError ? createError.message : null
        }

        // Credit initial tokens
        if (plan === 'basic') {
          const { data: balanceData } = await supabaseAdmin
            .from('user_balances')
            .select('balance')
            .eq('user_id', session.user.id)
            .single()

          const currentBalance = balanceData?.balance || 0
          const newBalance = currentBalance + 10 // Basic plan gets 10 tokens

          await supabaseAdmin
            .from('user_balances')
            .upsert({
              user_id: session.user.id,
              balance: newBalance,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            })

          result.tokensCredited = 10
          result.newBalance = newBalance
        }
      }
    }

    return new NextResponse(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("Error in subscription check:", error)
    return new NextResponse(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
} 