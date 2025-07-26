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

    // Generate real chart data from database
    const userGrowthData = await generateRealUserGrowthData(supabase)
    const revenueData = await generateRealRevenueData(supabase)
    const subscriptionData = await generateRealSubscriptionData(supabase)
    const messageData = await generateRealMessageData(supabase)

    return new NextResponse(JSON.stringify({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalRevenue,
      monthlyRecurringRevenue,
      totalMessages,
      totalEvents: totalEvents || 0,
      totalContacts: totalContacts || 0,
      totalTokensPurchased,
      userGrowthData,
      revenueData,
      subscriptionData,
      messageData
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

// Helper functions to generate real chart data from database
async function generateRealUserGrowthData(supabase: any) {
  const data = []
  const days = 30
  
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    // Get users created on this specific day
    const { count: usersOnDay } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
    
    data.push({
      date: date.toISOString().split('T')[0],
      users: usersOnDay || 0
    })
  }
  
  return data
}

async function generateRealRevenueData(supabase: any) {
  const data = []
  const days = 30
  
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    // Get revenue from transactions on this specific day
    const { data: transactionsOnDay } = await supabase
      .from('transactions')
      .select('amount')
      .eq('type', 'purchase')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
    
    const dailyRevenue = transactionsOnDay?.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0) || 0
    
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: dailyRevenue
    })
  }
  
  return data
}

async function generateRealSubscriptionData(supabase: any) {
  // Get subscription distribution
  const { data: subscriptions } = await supabase
    .from('user_subscriptions')
    .select('tier')
    .eq('status', 'active')
  
  // Count by tier
  const tierCounts: { [key: string]: number } = {}
  subscriptions?.forEach((sub: any) => {
    tierCounts[sub.tier] = (tierCounts[sub.tier] || 0) + 1
  })
  
  // Also count free users (users without active subscriptions)
  const { count: freeUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .not('id', 'in', `(${subscriptions?.map((s: any) => s.user_id).join(',') || 'null'})`)
  
  return [
    { tier: 'Free', count: freeUsers || 0 },
    { tier: 'Basic', count: tierCounts.basic || 0 },
    { tier: 'Pro', count: tierCounts.pro || 0 },
    { tier: 'Enterprise', count: tierCounts.enterprise || 0 }
  ]
}

async function generateRealMessageData(supabase: any) {
  const data = []
  const days = 30
  
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    // Get email messages on this day
    const { count: emailsOnDay } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
    
    // Get telegram messages on this day
    const { count: telegramOnDay } = await supabase
      .from('telegram_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
    
    data.push({
      date: date.toISOString().split('T')[0],
      emails: emailsOnDay || 0,
      telegram: telegramOnDay || 0
    })
  }
  
  return data
} 