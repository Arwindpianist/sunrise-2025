import { NextResponse } from "next/server"
import Stripe from 'stripe'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export const dynamic = "force-dynamic"

// Diagnostic endpoint to check and fix subscription status
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
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
    const userId = session.user.id
    const currentSubscriptionResult = await db.query(
      `
      select * from user_subscriptions
      where user_id = $1
      order by created_at desc
      limit 1
      `,
      [userId],
    )
    const currentSubscription = currentSubscriptionResult.rows[0] ?? null

    const result: any = {
      checkoutSession: {
        id: checkoutSession.id,
        status: checkoutSession.status,
        payment_status: checkoutSession.payment_status,
        subscription: checkoutSession.subscription,
        metadata: checkoutSession.metadata
      },
      currentSubscription: currentSubscription || null,
      subscriptionError: null,
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
          user_id: userId,
          tier: plan,
          status: 'active',
          stripe_subscription_id: stripeSubscription.id,
          current_period_start: getStripeDate((stripeSubscription as any).current_period_start),
          current_period_end: getStripeDate((stripeSubscription as any).current_period_end),
          updated_at: new Date().toISOString()
        }

        if (currentSubscription) {
          const updateResult = await db.query(
            `
            update user_subscriptions
            set
              tier = $1,
              status = $2,
              stripe_subscription_id = $3,
              current_period_start = $4,
              current_period_end = $5,
              updated_at = $6
            where id = $7
            returning *
            `,
            [
              subscriptionData.tier,
              subscriptionData.status,
              subscriptionData.stripe_subscription_id,
              subscriptionData.current_period_start,
              subscriptionData.current_period_end,
              subscriptionData.updated_at,
              currentSubscription.id,
            ],
          )
          result.updatedSubscription = updateResult.rows[0] ?? null
          result.updateError = null
          result.action = "Updated existing subscription"
        } else {
          const createdAt = new Date().toISOString()
          const insertResult = await db.query(
            `
            insert into user_subscriptions (
              id, user_id, tier, status, stripe_subscription_id,
              current_period_start, current_period_end, updated_at, created_at, plan_id, total_tokens_purchased
            )
            values (
              gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, 0
            )
            returning *
            `,
            [
              userId,
              subscriptionData.tier,
              subscriptionData.status,
              subscriptionData.stripe_subscription_id,
              subscriptionData.current_period_start,
              subscriptionData.current_period_end,
              subscriptionData.updated_at,
              createdAt,
              plan,
            ],
          )
          result.newSubscription = insertResult.rows[0] ?? null
          result.createError = null
          result.action = "Created new subscription"
        }

        // Credit initial tokens
        if (plan === 'basic') {
          const balanceResult = await db.query(
            `select balance from user_balances where user_id = $1 limit 1`,
            [userId],
          )

          const currentBalance = balanceResult.rows[0]?.balance || 0
          const newBalance = currentBalance + 10 // Basic plan gets 10 tokens

          const updateBalance = await db.query(
            `
            update user_balances
            set balance = $1, updated_at = $2
            where user_id = $3
            returning id
            `,
            [newBalance, new Date().toISOString(), userId],
          )
          if (!updateBalance.rowCount) {
            await db.query(
              `
              insert into user_balances (id, user_id, balance, created_at, updated_at)
              values (gen_random_uuid(), $1, $2, now(), $3)
              `,
              [userId, newBalance, new Date().toISOString()],
            )
          }

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