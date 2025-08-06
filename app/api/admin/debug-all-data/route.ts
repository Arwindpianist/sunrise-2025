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

    // Get ALL users
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, subscription_plan, created_at')
      .order('created_at', { ascending: false })

    // Get ALL subscriptions
    const { data: allSubscriptions, error: subscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    // Test the exact query that should work
    const { data: testQuery, error: testError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active')
      .neq('tier', 'free')

    return new NextResponse(JSON.stringify({
      allUsers: {
        count: allUsers?.length || 0,
        data: allUsers || [],
        error: usersError?.message || null
      },
      allSubscriptions: {
        count: allSubscriptions?.length || 0,
        data: allSubscriptions || [],
        error: subscriptionsError?.message || null
      },
      testQuery: {
        count: testQuery?.length || 0,
        data: testQuery || [],
        error: testError?.message || null
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Error debugging all data:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 