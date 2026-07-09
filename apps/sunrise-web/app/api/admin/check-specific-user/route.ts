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

    // Get user details
    const { data: user, error: userDetailsError } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetUserId)
      .single()

    // Get ALL user's subscriptions from user_subscriptions table (not just active ones)
    const { data: allSubscriptions, error: allSubscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    // Get user's active subscriptions from user_subscriptions table
    const { data: activeSubscriptions, error: activeSubscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // Get user's subscriptions with any status
    const { data: anyStatusSubscriptions, error: anyStatusError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', targetUserId)
      .neq('tier', 'free')
      .order('created_at', { ascending: false })

    // Get user's transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    // Get user's events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', targetUserId)

    // Get user's contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', targetUserId)

    return new NextResponse(JSON.stringify({
      targetUserId,
      user: user || null,
      userError: userDetailsError?.message || null,
      userSubscriptionPlan: user?.subscription_plan || null, // From users table
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
      anyStatusSubscriptions: {
        count: anyStatusSubscriptions?.length || 0,
        data: anyStatusSubscriptions || []
      },
      anyStatusError: anyStatusError?.message || null,
      transactions: {
        count: transactions?.length || 0,
        data: transactions || []
      },
      transactionsError: transactionsError?.message || null,
      events: {
        count: events?.length || 0,
        data: events || []
      },
      eventsError: eventsError?.message || null,
      contacts: {
        count: contacts?.length || 0,
        data: contacts || []
      },
      contactsError: contactsError?.message || null
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Error checking specific user:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 