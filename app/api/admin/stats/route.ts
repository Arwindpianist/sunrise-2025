import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
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

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get active users (users who signed up in the last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Get total revenue from transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount')
      .eq('type', 'purchase')

    const totalRevenue = transactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0

    // Get monthly recurring revenue (active subscriptions)
    const { data: activeSubscriptions } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('status', 'active')

    const monthlyRecurringRevenue = activeSubscriptions?.reduce((sum, sub) => {
      const monthlyPrice = sub.tier === 'basic' ? 9.90 : 
                          sub.tier === 'pro' ? 29.90 : 
                          sub.tier === 'enterprise' ? 79.90 : 0
      return sum + monthlyPrice
    }, 0) || 0

    // Get total messages sent (email + telegram)
    const { count: emailMessages } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })

    const { count: telegramMessages } = await supabase
      .from('telegram_logs')
      .select('*', { count: 'exact', head: true })

    const totalMessages = (emailMessages || 0) + (telegramMessages || 0)

    // Get total events created
    const { count: totalEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })

    // Get total contacts
    const { count: totalContacts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })

    // Get total tokens purchased
    const { data: tokenTransactions } = await supabase
      .from('transactions')
      .select('tokens')
      .eq('type', 'purchase')

    const totalTokensPurchased = tokenTransactions?.reduce((sum, tx) => sum + (tx.tokens || 0), 0) || 0

    return new NextResponse(JSON.stringify({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalRevenue,
      monthlyRecurringRevenue,
      totalMessages,
      totalEvents: totalEvents || 0,
      totalContacts: totalContacts || 0,
      totalTokensPurchased
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 