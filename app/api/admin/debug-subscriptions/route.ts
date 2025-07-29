import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
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

    // Debug: Get all subscriptions without any filters
    const { data: allSubscriptions, error: allSubsError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    // Debug: Get all users
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, subscription_plan, created_at')
      .order('created_at', { ascending: false })

    // Debug: Get active subscriptions with join
    const { data: activeSubscriptionsWithJoin, error: joinError } = await supabase
      .from('user_subscriptions')
      .select(`
        tier,
        user_id,
        status,
        created_at,
        users!inner(subscription_plan)
      `)
      .eq('status', 'active')

    // Debug: Get active subscriptions without join
    const { data: activeSubscriptionsNoJoin, error: noJoinError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active')

    // Debug: Check specific user subscription
    const { data: specificUserSub, error: specificError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', 'c68669a3-2cd0-47d3-b933-b8a4114af80b')

    return new NextResponse(JSON.stringify({
      debug: {
        allSubscriptions: {
          data: allSubscriptions,
          error: allSubsError,
          count: allSubscriptions?.length || 0
        },
        allUsers: {
          data: allUsers,
          error: allUsersError,
          count: allUsers?.length || 0
        },
        activeSubscriptionsWithJoin: {
          data: activeSubscriptionsWithJoin,
          error: joinError,
          count: activeSubscriptionsWithJoin?.length || 0
        },
        activeSubscriptionsNoJoin: {
          data: activeSubscriptionsNoJoin,
          error: noJoinError,
          count: activeSubscriptionsNoJoin?.length || 0
        },
        specificUserSub: {
          data: specificUserSub,
          error: specificError,
          count: specificUserSub?.length || 0
        }
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Error in debug subscriptions:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 