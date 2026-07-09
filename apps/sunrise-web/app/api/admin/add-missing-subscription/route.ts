import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
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
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }

    // Check if the subscription already exists
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', 'dadb0e29-078f-47aa-9639-41c115153d31')
      .eq('tier', 'pro')
      .single()

    if (existingSubscription) {
      return new NextResponse(JSON.stringify({ 
        message: 'Subscription already exists',
        subscription: existingSubscription 
      }), { status: 200 })
    }

    // Add the missing pro subscription
    const { data: newSubscription, error: insertError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: 'dadb0e29-078f-47aa-9639-41c115153d31',
        plan_id: 'pro',
        stripe_subscription_id: null,
        status: 'active',
        current_period_start: '2025-08-04T04:10:16.768+00:00',
        current_period_end: '2025-09-03T04:10:16.768+00:00',
        tier: 'pro',
        total_tokens_purchased: 0
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting subscription:', insertError)
      return new NextResponse(JSON.stringify({ 
        error: 'Failed to insert subscription',
        details: insertError 
      }), { status: 500 })
    }

    // Update the user's subscription_plan in users table
    const { error: updateError } = await supabase
      .from('users')
      .update({ subscription_plan: 'pro' })
      .eq('id', 'dadb0e29-078f-47aa-9639-41c115153d31')

    if (updateError) {
      console.error('Error updating user subscription plan:', updateError)
    }

    return new NextResponse(JSON.stringify({ 
      message: 'Pro subscription added successfully',
      subscription: newSubscription,
      userUpdated: !updateError
    }), { status: 200 })

  } catch (error) {
    console.error('Error adding missing subscription:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error', details: error }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function POST(request: Request) {
  return GET(request)
} 