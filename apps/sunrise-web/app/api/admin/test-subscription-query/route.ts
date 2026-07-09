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

    // Test 1: Get ALL subscriptions without any filters
    const { data: allSubscriptions, error: allError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    // Test 2: Get subscriptions with status = 'active'
    const { data: activeSubscriptions, error: activeError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // Test 3: Get subscriptions with tier != 'free'
    const { data: nonFreeSubscriptions, error: nonFreeError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .neq('tier', 'free')
      .order('created_at', { ascending: false })

    // Test 4: Get subscriptions excluding admin user
    const { data: nonAdminSubscriptions, error: nonAdminError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .not('user_id', 'in', EXCLUDED_USER_IDS)
      .order('created_at', { ascending: false })

    // Test 5: Get the exact query we use in the admin stats
    const { data: finalSubscriptions, error: finalError } = await supabase
      .from('user_subscriptions')
      .select(`
        tier,
        user_id
      `)
      .eq('status', 'active')
      .neq('tier', 'free')
      .not('user_id', 'in', EXCLUDED_USER_IDS)

    // Test 6: Check the specific user's subscription
    const { data: specificUserSub, error: specificError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', 'dadb0e29-078f-47aa-9639-41c115153d31')

    return new NextResponse(JSON.stringify({
      allSubscriptions: {
        count: allSubscriptions?.length || 0,
        data: allSubscriptions || [],
        error: allError?.message || null
      },
      activeSubscriptions: {
        count: activeSubscriptions?.length || 0,
        data: activeSubscriptions || [],
        error: activeError?.message || null
      },
      nonFreeSubscriptions: {
        count: nonFreeSubscriptions?.length || 0,
        data: nonFreeSubscriptions || [],
        error: nonFreeError?.message || null
      },
      nonAdminSubscriptions: {
        count: nonAdminSubscriptions?.length || 0,
        data: nonAdminSubscriptions || [],
        error: nonAdminError?.message || null
      },
      finalSubscriptions: {
        count: finalSubscriptions?.length || 0,
        data: finalSubscriptions || [],
        error: finalError?.message || null
      },
      specificUserSub: {
        count: specificUserSub?.length || 0,
        data: specificUserSub || [],
        error: specificError?.message || null
      },
      excludedUserIds: EXCLUDED_USER_IDS
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Error testing subscription query:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 