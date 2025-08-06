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

    // Test the simple query approach (same as debug-all-data)
    const { data: simpleQuery, error: simpleError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active')
      .neq('tier', 'free')

    // Test the admin dashboard query (with admin exclusion)
    const { data: dashboardQuery, error: dashboardError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active')
      .neq('tier', 'free')
      .not('user_id', 'eq', EXCLUDED_USER_IDS[0])

    return new NextResponse(JSON.stringify({
      simpleQuery: {
        count: simpleQuery?.length || 0,
        data: simpleQuery || [],
        error: simpleError?.message || null
      },
      dashboardQuery: {
        count: dashboardQuery?.length || 0,
        data: dashboardQuery || [],
        error: dashboardError?.message || null
      },
      excludedUserIds: EXCLUDED_USER_IDS
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Error testing simple query:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error', details: error }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 