import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from 'stripe'
import { SUBSCRIPTION_FEATURES } from "@/lib/subscription"

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

    if (!userId || !plan) {
      console.error('Missing user_id or plan in session metadata')
      return
    }

    // Create or update subscription in database
    const subscriptionData = {
      user_id: userId,
      tier: plan,
      status: 'active',
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscription.id,
      current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single()

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

    // Credit initial monthly tokens
    await creditMonthlyTokens(userId, plan, supabase)
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

    // Update subscription period in database
    await supabase
      .from('user_subscriptions')
      .update({
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    // Credit monthly tokens
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

  // Update subscription status in database
  await supabase
    .from('user_subscriptions')
    .update({
      tier: plan,
      status: subscription.status === 'active' ? 'active' : 'inactive',
      current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
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