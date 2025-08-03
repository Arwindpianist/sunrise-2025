import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from 'stripe'
import { SUBSCRIPTION_FEATURES } from "@/lib/subscription"
import { getPlanChangeInfo, calculateProratedTokens } from "@/lib/billing-utils"
import { verifySubscriptionChangeSource, logSubscriptionSecurityEvent, verifyPaymentCompletion } from "@/lib/subscription-security"

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
      logSubscriptionSecurityEvent('unknown', 'webhook_signature_failed', { error: err.message })
      return new NextResponse(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Log webhook event for security monitoring
    logSubscriptionSecurityEvent('webhook', 'stripe_event_received', { 
      eventType: event.type,
      eventId: event.id 
    })

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabase, signature)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, supabase, signature)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase, signature)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase, signature)
        break
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase, signature)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new NextResponse(JSON.stringify({ received: true }), { status: 200 })
  } catch (error: any) {
    console.error('Webhook error:', error)
    logSubscriptionSecurityEvent('webhook', 'webhook_error', { error: error.message })
    return new NextResponse(
      JSON.stringify({ error: 'Webhook handler failed' }),
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabase: any, signature: string) {
  if (session.mode === 'subscription' && session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string) as Stripe.Subscription
    const userId = session.metadata?.user_id
    const plan = session.metadata?.plan
    const isUpgrade = session.metadata?.is_upgrade === 'true'
    const fromTier = session.metadata?.from_tier || 'free'

    if (!userId || !plan) {
      console.error('Missing user_id or plan in session metadata')
      logSubscriptionSecurityEvent('unknown', 'missing_metadata', { sessionId: session.id })
      return
    }

    // Verify webhook source
    if (!verifySubscriptionChangeSource(userId, 'stripe_webhook', signature)) {
      logSubscriptionSecurityEvent(userId, 'unauthorized_webhook', { sessionId: session.id })
      return
    }

    // Verify payment completion
    const paymentVerification = await verifyPaymentCompletion(subscription.id, userId)
    if (!paymentVerification.isValid) {
      console.error('Payment verification failed:', paymentVerification.error)
      logSubscriptionSecurityEvent(userId, 'payment_verification_failed', { 
        sessionId: session.id,
        error: paymentVerification.error 
      })
      return
    }

    // Get existing subscription data
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    // Create or update subscription in database
    const subscriptionData = {
      user_id: userId,
      tier: plan,
      status: 'active',
      current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id)

      if (updateError) {
        console.error('Error updating subscription:', updateError)
        logSubscriptionSecurityEvent(userId, 'subscription_update_failed', { error: updateError })
        return
      }
    } else {
      // Create new subscription
      const { error: createError } = await supabase
        .from('user_subscriptions')
        .insert({
          ...subscriptionData,
          created_at: new Date().toISOString()
        })

      if (createError) {
        console.error('Error creating subscription:', createError)
        logSubscriptionSecurityEvent(userId, 'subscription_creation_failed', { error: createError })
        return
      }
    }

    // Handle token allocation based on whether this is an upgrade or new subscription
    if (isUpgrade && existingSubscription) {
      await handlePlanChangeTokens(userId, fromTier, plan, existingSubscription, supabase)
    } else {
      // Credit initial monthly tokens for new subscription
      await creditMonthlyTokens(userId, plan, supabase)
    }

    logSubscriptionSecurityEvent(userId, 'subscription_activated', { 
      plan, 
      isUpgrade, 
      sessionId: session.id 
    })
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, supabase: any, signature: string) {
  if ((invoice as any).subscription) {
    const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string) as Stripe.Subscription
    const userId = subscription.metadata?.user_id
    const plan = subscription.metadata?.plan

    if (!userId || !plan) {
      console.error('Missing user_id or plan in subscription metadata')
      return
    }

    // Verify webhook source
    if (!verifySubscriptionChangeSource(userId, 'stripe_webhook', signature)) {
      return
    }

    // Update subscription period in database
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active')

    if (updateError) {
      console.error('Error updating subscription period:', updateError)
      return
    }

    // Credit monthly tokens for regular billing cycle
    await creditMonthlyTokens(userId, plan, supabase)

    logSubscriptionSecurityEvent(userId, 'payment_succeeded', { 
      plan, 
      invoiceId: invoice.id 
    })
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: any, signature: string) {
  const userId = subscription.metadata?.user_id
  const plan = subscription.metadata?.plan

  if (!userId || !plan) {
    console.error('Missing user_id or plan in subscription metadata')
    return
  }

  // Verify webhook source
  if (!verifySubscriptionChangeSource(userId, 'stripe_webhook', signature)) {
    return
  }

  // Update subscription status in database
  const { error: updateError } = await supabase
    .from('user_subscriptions')
    .update({
      tier: plan,
      status: subscription.status === 'active' ? 'active' : 'inactive',
      current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('status', 'active')

  if (updateError) {
    console.error('Error updating subscription:', updateError)
    return
  }

  logSubscriptionSecurityEvent(userId, 'subscription_updated', { 
    plan, 
    status: subscription.status 
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any, signature: string) {
  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  // Verify webhook source
  if (!verifySubscriptionChangeSource(userId, 'stripe_webhook', signature)) {
    return
  }

  // Update subscription status to cancelled
  const { error: updateError } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('status', 'active')

  if (updateError) {
    console.error('Error cancelling subscription:', updateError)
    return
  }

  logSubscriptionSecurityEvent(userId, 'subscription_cancelled', {})
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, supabase: any, signature: string) {
  if ((invoice as any).subscription) {
    const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string) as Stripe.Subscription
    const userId = subscription.metadata?.user_id

    if (!userId) {
      console.error('Missing user_id in subscription metadata')
      return
    }

    // Verify webhook source
    if (!verifySubscriptionChangeSource(userId, 'stripe_webhook', signature)) {
      return
    }

    // Update subscription status to past_due
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    if (updateError) {
      console.error('Error updating subscription status:', updateError)
      return
    }

    logSubscriptionSecurityEvent(userId, 'payment_failed', { 
      invoiceId: invoice.id 
    })
  }
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