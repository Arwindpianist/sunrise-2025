import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user is admin
    const userEmail = session.user.email
    if (userEmail !== "arwindpianist@gmail.com") {
      return new NextResponse(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const body = await request.json()
    const { userId, tier, stripeSubscriptionId } = body

    if (!userId || !tier || !stripeSubscriptionId) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate Stripe subscription ID format
    if (!stripeSubscriptionId.startsWith('sub_')) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid Stripe subscription ID format' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify the Stripe subscription exists and is valid
    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
      
      if (stripeSubscription.status !== 'active' && stripeSubscription.status !== 'trialing') {
        return new NextResponse(
          JSON.stringify({ error: 'Stripe subscription is not active' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      // Check if the subscription belongs to the user (optional additional verification)
      // You might want to store stripe_customer_id in your users table for this
    } catch (error: any) {
      console.error('Error verifying Stripe subscription:', error)
      return new NextResponse(
        JSON.stringify({ error: 'Invalid or non-existent Stripe subscription ID' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Get current subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    // Prepare subscription data
    const subscriptionData = {
      user_id: userId,
      tier: tier,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
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
        return new NextResponse(
          JSON.stringify({ error: 'Failed to update subscription' }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
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
        return new NextResponse(
          JSON.stringify({ error: 'Failed to create subscription' }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Log the admin action
    console.log(`Admin ${userEmail} updated subscription for user ${userId} to ${tier} tier`)

    return new NextResponse(
      JSON.stringify({ 
        success: true,
        message: 'Subscription updated successfully'
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error: any) {
    console.error('Error in admin subscription update:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 