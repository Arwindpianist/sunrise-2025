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

    const excludedUserId = 'dd353545-03e8-43ad-a7a7-0715ebe7d765'

    // Get user details
    const { data: user, error: userDetailsError } = await supabase
      .from('users')
      .select('*')
      .eq('id', excludedUserId)
      .single()

    // Get user's subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', excludedUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get user's events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', excludedUserId)

    // Get user's contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', excludedUserId)

    // Get user's transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', excludedUserId)

    return new NextResponse(JSON.stringify({
      excludedUserId,
      user: user || null,
      userError: userDetailsError?.message || null,
      subscription: subscription || null,
      subscriptionError: subscriptionError?.message || null,
      events: {
        count: events?.length || 0,
        data: events || []
      },
      eventsError: eventsError?.message || null,
      contacts: {
        count: contacts?.length || 0,
        data: contacts || []
      },
      contactsError: contactsError?.message || null,
      transactions: {
        count: transactions?.length || 0,
        data: transactions || []
      },
      transactionsError: transactionsError?.message || null
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Error checking user:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 