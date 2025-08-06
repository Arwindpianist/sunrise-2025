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

    const targetUserId = 'dadb0e29-078f-47aa-9639-41c115153d31'

    // Get the user's current subscription plan
    const { data: user, error: userError2 } = await supabase
      .from('users')
      .select('subscription_plan, created_at')
      .eq('id', targetUserId)
      .single()

    if (userError2 || !user) {
      return new NextResponse(JSON.stringify({ 
        error: 'User not found',
        details: userError2 
      }), { status: 404 })
    }

    // Check if subscription record already exists
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('tier', user.subscription_plan)
      .single()

    if (existingSubscription) {
      return new NextResponse(JSON.stringify({ 
        message: 'Subscription record already exists',
        subscription: existingSubscription 
      }), { status: 200 })
    }

    // Create the missing subscription record
    const now = new Date()
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

    const { data: newSubscription, error: insertError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: targetUserId,
        plan_id: user.subscription_plan,
        stripe_subscription_id: null, // No Stripe ID since this is fixing a sync issue
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: oneMonthFromNow.toISOString(),
        tier: user.subscription_plan,
        total_tokens_purchased: 0,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating subscription record:', insertError)
      return new NextResponse(JSON.stringify({ 
        error: 'Failed to create subscription record',
        details: insertError 
      }), { status: 500 })
    }

    return new NextResponse(JSON.stringify({ 
      message: 'Subscription record created successfully',
      subscription: newSubscription,
      user: {
        id: targetUserId,
        subscription_plan: user.subscription_plan
      }
    }), { status: 200 })

  } catch (error) {
    console.error('Error fixing missing subscription:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error', details: error }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 