import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { SUBSCRIPTION_FEATURES } from '@/lib/subscription'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

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

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated and is admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Check if user is admin
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('subscription_plan')
      .eq('id', session.user.id)
      .single()

    if (userError || userProfile?.subscription_plan !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Forbidden - Admin access required' }), { status: 403 })
    }

    const { userId, stripeSubscriptionId } = await request.json()

    if (!userId || !stripeSubscriptionId) {
      return new NextResponse(JSON.stringify({ 
        error: 'Missing required fields: userId and stripeSubscriptionId' 
      }), { status: 400 })
    }

    const result: {
      userId: string
      stripeSubscriptionId: string
      actions: string[]
      restoredSubscription: any
      restoredBalance: number | null
      error: string | null
    } = {
      userId,
      stripeSubscriptionId,
      actions: [],
      restoredSubscription: null,
      restoredBalance: null,
      error: null
    }

    try {
      // Retrieve the Stripe subscription to get current details
      const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
      
      if (!stripeSubscription) {
        result.error = 'Stripe subscription not found'
        return new NextResponse(JSON.stringify(result), { status: 404 })
      }

      // Extract plan from Stripe subscription metadata
      const plan = stripeSubscription.metadata?.plan || 'basic'
      const features = SUBSCRIPTION_FEATURES[plan as keyof typeof SUBSCRIPTION_FEATURES]

      if (!features) {
        result.error = `Invalid plan: ${plan}`
        return new NextResponse(JSON.stringify(result), { status: 400 })
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

      // Update or create subscription record
      const subscriptionData = {
        user_id: userId,
        tier: plan,
        plan_id: plan,
        status: stripeSubscription.status === 'active' ? 'active' : 'inactive',
        stripe_subscription_id: stripeSubscriptionId,
        current_period_start: getStripeDate((stripeSubscription as any).current_period_start),
        current_period_end: getStripeDate((stripeSubscription as any).current_period_end),
        updated_at: new Date().toISOString()
      }

      // Check if subscription record exists
      const { data: existingSubscription } = await supabaseAdmin
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

      let restoredSubscription
      if (existingSubscription) {
        // Update existing subscription
        const { data: updatedSubscription, error: updateError } = await supabaseAdmin
          .from('user_subscriptions')
          .update(subscriptionData)
          .eq('id', existingSubscription.id)
          .select()
          .single()

        if (updateError) {
          result.error = `Failed to update subscription: ${updateError.message}`
          return new NextResponse(JSON.stringify(result), { status: 500 })
        }

        restoredSubscription = updatedSubscription
        result.actions.push('Updated existing subscription record')
      } else {
        // Create new subscription record
        const { data: newSubscription, error: createError } = await supabaseAdmin
          .from('user_subscriptions')
          .insert({
            ...subscriptionData,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          result.error = `Failed to create subscription: ${createError.message}`
          return new NextResponse(JSON.stringify(result), { status: 500 })
        }

        restoredSubscription = newSubscription
        result.actions.push('Created new subscription record')
      }

      // Restore user balance to a reasonable amount (e.g., monthly tokens + some extra)
      const monthlyTokens = features.monthlyTokens || 0
      const restoredBalance = monthlyTokens + 25 // Give them monthly tokens + 25 extra

      const { error: balanceError } = await supabaseAdmin
        .from('user_balances')
        .upsert({
          user_id: userId,
          balance: restoredBalance,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (balanceError) {
        result.error = `Failed to restore balance: ${balanceError.message}`
        return new NextResponse(JSON.stringify(result), { status: 500 })
      }

      result.actions.push(`Restored balance to ${restoredBalance} tokens`)
      result.restoredSubscription = restoredSubscription
      result.restoredBalance = restoredBalance

      console.log(`Subscription restored for user ${userId}: ${plan} plan with ${restoredBalance} tokens`)

      return new NextResponse(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
        },
      })

    } catch (stripeError: any) {
      result.error = `Stripe error: ${stripeError.message}`
      return new NextResponse(JSON.stringify(result), { status: 500 })
    }

  } catch (error: any) {
    console.error('Error restoring subscription:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 