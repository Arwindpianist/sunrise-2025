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

    const EXCLUDED_USER_IDS = ['48227699-4260-448f-b418-e4b48afa9aca']

    // Get ALL subscriptions without any filters
    const { data: allSubscriptions, error: allError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    // Get the specific pro user subscription by exact user_id
    const { data: proUserExact, error: proUserExactError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', 'dadb0e29-078f-47aa-9639-41c115153d31')

    // Get all users to see if the pro user exists
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, email, subscription_plan')
      .order('created_at', { ascending: false })

    // Get the specific pro user from users table
    const { data: proUserFromUsers, error: proUserFromUsersError } = await supabase
      .from('users')
      .select('*')
      .eq('id', 'dadb0e29-078f-47aa-9639-41c115153d31')

    // Test raw SQL-like query to see if there's a schema issue
    const { data: rawQuery, error: rawError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .or('user_id.eq.dadb0e29-078f-47aa-9639-41c115153d31,tier.eq.pro')

    // Test with different status values
    const { data: anyStatus, error: anyStatusError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', 'dadb0e29-078f-47aa-9639-41c115153d31')

    // Test with different tier values
    const { data: proTier, error: proTierError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('tier', 'pro')

    // Test with plan_id instead of tier
    const { data: proPlanId, error: proPlanIdError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('plan_id', 'pro')

    return new NextResponse(JSON.stringify({
      allSubscriptions: {
        count: allSubscriptions?.length || 0,
        data: allSubscriptions || [],
        error: allError?.message || null
      },
      proUserExact: {
        count: proUserExact?.length || 0,
        data: proUserExact || [],
        error: proUserExactError?.message || null
      },
      allUsers: {
        count: allUsers?.length || 0,
        data: allUsers || [],
        error: allUsersError?.message || null
      },
      proUserFromUsers: {
        count: proUserFromUsers?.length || 0,
        data: proUserFromUsers || [],
        error: proUserFromUsersError?.message || null
      },
      rawQuery: {
        count: rawQuery?.length || 0,
        data: rawQuery || [],
        error: rawError?.message || null
      },
      anyStatus: {
        count: anyStatus?.length || 0,
        data: anyStatus || [],
        error: anyStatusError?.message || null
      },
      proTier: {
        count: proTier?.length || 0,
        data: proTier || [],
        error: proTierError?.message || null
      },
      proPlanId: {
        count: proPlanId?.length || 0,
        data: proPlanId || [],
        error: proPlanIdError?.message || null
      },
      excludedUserIds: EXCLUDED_USER_IDS,
      sessionUserId: session.user.id
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Error in debug simple:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error', details: error }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 