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

    // Get ALL subscriptions from user_subscriptions table
    const { data: allSubscriptions, error: allSubscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    // Get active subscriptions
    const { data: activeSubscriptions, error: activeSubscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // Get subscriptions by tier
    const { data: proSubscriptions, error: proSubscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('tier', 'pro')
      .order('created_at', { ascending: false })

    const { data: basicSubscriptions, error: basicSubscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('tier', 'basic')
      .order('created_at', { ascending: false })

    const { data: enterpriseSubscriptions, error: enterpriseSubscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('tier', 'enterprise')
      .order('created_at', { ascending: false })

    return new NextResponse(JSON.stringify({
      allSubscriptions: {
        count: allSubscriptions?.length || 0,
        data: allSubscriptions || []
      },
      allSubscriptionsError: allSubscriptionsError?.message || null,
      activeSubscriptions: {
        count: activeSubscriptions?.length || 0,
        data: activeSubscriptions || []
      },
      activeSubscriptionsError: activeSubscriptionsError?.message || null,
      proSubscriptions: {
        count: proSubscriptions?.length || 0,
        data: proSubscriptions || []
      },
      proSubscriptionsError: proSubscriptionsError?.message || null,
      basicSubscriptions: {
        count: basicSubscriptions?.length || 0,
        data: basicSubscriptions || []
      },
      basicSubscriptionsError: basicSubscriptionsError?.message || null,
      enterpriseSubscriptions: {
        count: enterpriseSubscriptions?.length || 0,
        data: enterpriseSubscriptions || []
      },
      enterpriseSubscriptionsError: enterpriseSubscriptionsError?.message || null
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Error checking all subscriptions:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 