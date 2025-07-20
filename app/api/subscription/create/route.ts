import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, plan, priceId } = await request.json()

    if (!userId || !plan || !priceId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Get user's email from Supabase users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (userError || !userData?.email) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: userData.email,
      metadata: {
        user_id: userId,
      },
    })

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        user_id: userId,
        plan: plan,
      },
    })

    // Update user subscription in database
    const { error: dbError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        tier: plan,
        status: 'active',
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      })

    if (dbError) {
      console.error('Database error:', dbError)
      // Continue anyway as Stripe subscription was created
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
} 