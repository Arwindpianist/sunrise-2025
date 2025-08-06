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

    // Test the FIXED query from admin stats
    const { data: fixedQueryResult, error: fixedQueryError } = await supabase
      .from('user_subscriptions')
      .select(`
        tier,
        user_id
      `)
      .eq('status', 'active')
      .not('tier', 'is', null)
      .neq('tier', 'free')
      .not('user_id', 'eq', EXCLUDED_USER_IDS[0])

    // Test the OLD query (without null check)
    const { data: oldQueryResult, error: oldQueryError } = await supabase
      .from('user_subscriptions')
      .select(`
        tier,
        user_id
      `)
      .eq('status', 'active')
      .neq('tier', 'free')
      .not('user_id', 'eq', EXCLUDED_USER_IDS[0])

    // Test just the pro subscription
    const { data: proSubscription, error: proError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', 'dadb0e29-078f-47aa-9639-41c115153d31')

    // Test all active subscriptions
    const { data: allActive, error: allActiveError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active')

    return new NextResponse(JSON.stringify({
      fixedQueryResult: {
        count: fixedQueryResult?.length || 0,
        data: fixedQueryResult || [],
        error: fixedQueryError?.message || null
      },
      oldQueryResult: {
        count: oldQueryResult?.length || 0,
        data: oldQueryResult || [],
        error: oldQueryError?.message || null
      },
      proSubscription: {
        count: proSubscription?.length || 0,
        data: proSubscription || [],
        error: proError?.message || null
      },
      allActive: {
        count: allActive?.length || 0,
        data: allActive || [],
        error: allActiveError?.message || null
      },
      excludedUserIds: EXCLUDED_USER_IDS
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Error testing exact query:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 