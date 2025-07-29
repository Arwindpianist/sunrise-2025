import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from 'stripe'
import { SUBSCRIPTION_FEATURES } from "@/lib/subscription"
import { getPlanChangeInfo, calculateProratedTokens } from "@/lib/billing-utils"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return new NextResponse(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabase)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, supabase)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new NextResponse(JSON.stringify({ received: true }), { status: 200 })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Webhook handler failed' }),
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabase: any) {
  if (session.mode === 'subscription' && session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string) as Stripe.Subscription
    const userId = session.metadata?.user_id
    const plan = session.metadata?.plan
    const isUpgrade = session.metadata?.is_upgrade === 'true'
    const fromTier = session.metadata?.from_tier || 'free'

    if (!userId || !plan) {
      console.error('Missing user_id or plan in session metadata')
      return
    }

    // Get existing subscription data
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

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

    // Create or update subscription in database
    const subscriptionData = {
      user_id: userId,
      tier: plan,
      status: 'active',
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscription.id,
      current_period_start: getStripeDate((subscription as any).current_period_start),
      current_period_end: getStripeDate((subscription as any).current_period_end),
      updated_at: new Date().toISOString()
    }

    if (existingSubscription) {
      // Update existing subscription
      await supabase
        .from('user_subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id)
    } else {
      // Create new subscription
      await supabase
        .from('user_subscriptions')
        .insert({
          ...subscriptionData,
          created_at: new Date().toISOString()
        })
    }

    // Handle token allocation based on whether this is an upgrade or new subscription
    if (isUpgrade && existingSubscription) {
      await handlePlanChangeTokens(userId, fromTier, plan, existingSubscription, supabase)
    } else {
      // Credit initial monthly tokens for new subscription
      await creditMonthlyTokens(userId, plan, supabase)
    }
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  if ((invoice as any).subscription) {
    const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string) as Stripe.Subscription
    const userId = subscription.metadata?.user_id
    const plan = subscription.metadata?.plan

    if (!userId || !plan) {
      console.error('Missing user_id or plan in subscription metadata')
      return
    }

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

    // Update subscription period in database
    await supabase
      .from('user_subscriptions')
      .update({
        current_period_start: getStripeDate((subscription as any).current_period_start),
        current_period_end: getStripeDate((subscription as any).current_period_end),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    // Credit monthly tokens for regular billing cycle
    await creditMonthlyTokens(userId, plan, supabase)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: any) {
  const userId = subscription.metadata?.user_id
  const plan = subscription.metadata?.plan

  if (!userId || !plan) {
    console.error('Missing user_id or plan in subscription metadata')
    return
  }

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

  // Update subscription status in database
  await supabase
    .from('user_subscriptions')
    .update({
      tier: plan,
      status: subscription.status === 'active' ? 'active' : 'inactive',
      current_period_start: getStripeDate((subscription as any).current_period_start),
      current_period_end: getStripeDate((subscription as any).current_period_end),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  // Update subscription status to cancelled
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handlePlanChangeTokens(
  userId: string, 
  fromTier: string, 
  toTier: string, 
  existingSubscription: any, 
  supabase: any
) {
  try {
    // Calculate prorated token allocation
    const planChangeInfo = getPlanChangeInfo(
      fromTier as any,
      toTier as any,
      existingSubscription.current_period_start,
      existingSubscription.current_period_end
    )

    const proratedTokens = calculateProratedTokens(
      fromTier as any,
      toTier as any,
      planChangeInfo.prorationInfo
    )

    if (proratedTokens !== 0) {
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
          type: proratedTokens > 0 ? 'upgrade_credit' : 'downgrade_debit',
          amount: Math.abs(proratedTokens),
          description: proratedTokens > 0 
            ? `Plan upgrade: ${fromTier} → ${toTier} (${planChangeInfo.prorationInfo.daysRemaining} days remaining)`
            : `Plan downgrade: ${fromTier} → ${toTier} (${planChangeInfo.prorationInfo.daysRemaining} days remaining)`,
          status: 'completed',
          created_at: new Date().toISOString()
        })

      if (transactionError) {
        console.error('Error recording transaction:', transactionError)
      }

      console.log(`Plan change tokens processed: ${proratedTokens} tokens for user ${userId} (${fromTier} → ${toTier})`)
    }
  } catch (error) {
    console.error('Error handling plan change tokens:', error)
  }
}

async function creditMonthlyTokens(userId: string, plan: string, supabase: any) {
  const features = SUBSCRIPTION_FEATURES[plan as keyof typeof SUBSCRIPTION_FEATURES]
  if (!features || features.monthlyTokens <= 0) {
    return
  }

  // Credit tokens to user balance
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
  const newBalance = currentBalance + features.monthlyTokens

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
      type: 'subscription_credit',
      amount: features.monthlyTokens,
      description: `Monthly ${plan} subscription tokens`,
      status: 'completed',
      created_at: new Date().toISOString()
    })

  if (transactionError) {
    console.error('Error recording transaction:', transactionError)
  }

  console.log(`Credited ${features.monthlyTokens} tokens to user ${userId} for ${plan} subscription`)
} 