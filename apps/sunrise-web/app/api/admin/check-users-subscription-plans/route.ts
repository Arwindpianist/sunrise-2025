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

    // Get all users with their subscription_plan from users table
    const { data: usersWithPlans, error: usersError } = await supabase
      .from('users')
      .select('id, email, subscription_plan, created_at')
      .not('subscription_plan', 'is', null)
      .neq('subscription_plan', 'free')
      .order('created_at', { ascending: false })

    // Get all subscriptions from user_subscriptions table
    const { data: allSubscriptions, error: subscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('user_id, tier, status, created_at')
      .order('created_at', { ascending: false })

    // Create a map of user subscriptions
    const subscriptionMap = new Map()
    allSubscriptions?.forEach((sub: any) => {
      subscriptionMap.set(sub.user_id, sub)
    })

    // Combine the data
    const combinedData = usersWithPlans?.map((user: any) => ({
      userId: user.id,
      email: user.email,
      usersTablePlan: user.subscription_plan,
      subscriptionTableData: subscriptionMap.get(user.id) || null,
      hasBoth: subscriptionMap.has(user.id)
    })) || []

    return new NextResponse(JSON.stringify({
      usersWithPlans: {
        count: usersWithPlans?.length || 0,
        data: usersWithPlans || []
      },
      usersError: usersError?.message || null,
      allSubscriptions: {
        count: allSubscriptions?.length || 0,
        data: allSubscriptions || []
      },
      subscriptionsError: subscriptionsError?.message || null,
      combinedData: {
        count: combinedData.length,
        data: combinedData
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Error checking users subscription plans:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 