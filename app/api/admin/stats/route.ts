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

    // Get comprehensive revenue data
    const revenueStats = await calculateRevenue(supabase)
    const { totalRevenue, monthlyRecurringRevenue, subscriptionRevenue, tokenRevenue, totalSubscriptions } = revenueStats

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

    // Generate real chart data from database with timeout
    const chartDataPromise = Promise.all([
      generateUserGrowthData(supabase),
      generateRevenueData(supabase),
      generateSubscriptionData(supabase),
      generateMessageData(supabase)
    ])
    
    let userGrowthData: any[] = []
    let chartRevenueData: any[] = []
    let subscriptionData: any[] = []
    let messageData: any[] = []
    
    try {
      [userGrowthData, chartRevenueData, subscriptionData, messageData] = await Promise.race([
        chartDataPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Chart data timeout')), 10000)
        )
      ]) as [any[], any[], any[], any[]]
    } catch (error) {
      console.error('Error fetching chart data:', error)
      // Return empty arrays if chart data fails
    }

    return new NextResponse(JSON.stringify({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalRevenue,
      monthlyRecurringRevenue,
      subscriptionRevenue,
      tokenRevenue,
      totalSubscriptions,
      totalMessages,
      totalEvents: totalEvents || 0,
      totalContacts: totalContacts || 0,
      totalTokensPurchased,
      userGrowthData,
      revenueData: chartRevenueData,
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
async function generateUserGrowthData(supabase: any) {
  try {
    // Get all users created in the last 30 days in one query
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: users } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })
    
    // Group users by date
    const userCounts: { [key: string]: number } = {}
    users?.forEach((user: any) => {
      const date = user.created_at.split('T')[0]
      userCounts[date] = (userCounts[date] || 0) + 1
    })
    
    // Generate data for last 30 days
    const data = []
    for (let i = 30; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      data.push({
        date: dateStr,
        users: userCounts[dateStr] || 0
      })
    }
    
    return data
  } catch (error) {
    console.error('Error generating user growth data:', error)
    return []
  }
}

async function generateRevenueData(supabase: any) {
  try {
    // Get all transactions in the last 30 days in one query
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('type', 'purchase')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })
    
    // Group transactions by date
    const revenueByDate: { [key: string]: number } = {}
    transactions?.forEach((tx: any) => {
      const date = tx.created_at.split('T')[0]
      revenueByDate[date] = (revenueByDate[date] || 0) + (tx.amount || 0)
    })
    
    // Generate data for last 30 days
    const data = []
    for (let i = 30; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      data.push({
        date: dateStr,
        revenue: revenueByDate[dateStr] || 0
      })
    }
    
    return data
  } catch (error) {
    console.error('Error generating revenue data:', error)
    return []
  }
}

async function generateSubscriptionData(supabase: any) {
  // Get subscription distribution by tier, excluding free users
  const { data: subscriptions } = await supabase
    .from('user_subscriptions')
    .select(`
      tier,
      user_id
    `)
    .eq('status', 'active')
    .neq('tier', 'free')
  
  const tierCounts: { [key: string]: number } = {}
  
  subscriptions?.forEach((sub: any) => {
    const tier = sub.tier.charAt(0).toUpperCase() + sub.tier.slice(1) // Capitalize first letter
    tierCounts[tier] = (tierCounts[tier] || 0) + 1
  })
  
  // Convert to array format for chart
  const data = Object.entries(tierCounts).map(([tier, count]) => ({
    tier,
    count
  }))
  
  return data.length > 0 ? data : [
    { tier: 'Free', count: 0 },
    { tier: 'Basic', count: 0 },
    { tier: 'Pro', count: 0 },
    { tier: 'Enterprise', count: 0 }
  ]
}

async function generateMessageData(supabase: any) {
  try {
    // Get all messages in the last 30 days in parallel queries
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const [emailResult, telegramResult] = await Promise.all([
      supabase
        .from('email_logs')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true }),
      supabase
        .from('telegram_logs')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true })
    ])
    
    // Group emails by date
    const emailCounts: { [key: string]: number } = {}
    emailResult.data?.forEach((email: any) => {
      const date = email.created_at.split('T')[0]
      emailCounts[date] = (emailCounts[date] || 0) + 1
    })
    
    // Group telegram messages by date
    const telegramCounts: { [key: string]: number } = {}
    telegramResult.data?.forEach((telegram: any) => {
      const date = telegram.created_at.split('T')[0]
      telegramCounts[date] = (telegramCounts[date] || 0) + 1
    })
    
    // Generate data for last 30 days
    const data = []
    for (let i = 30; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      data.push({
        date: dateStr,
        emails: emailCounts[dateStr] || 0,
        telegram: telegramCounts[dateStr] || 0
      })
    }
    
    return data
  } catch (error) {
    console.error('Error generating message data:', error)
    return []
  }
}

// Comprehensive revenue calculation function
async function calculateRevenue(supabase: any) {
  try {
    // Get all transactions (token purchases)
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, type, created_at')
      .eq('type', 'purchase')

    // Calculate token revenue
    const tokenRevenue = transactions?.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0) || 0

    // Get all active subscriptions (excluding admin users)
    const { data: activeSubscriptions } = await supabase
      .from('user_subscriptions')
      .select(`
        tier,
        user_id,
        status,
        created_at
      `)
      .eq('status', 'active')
      .neq('tier', 'free')

    // Calculate subscription revenue
    let subscriptionRevenue = 0
    let monthlyRecurringRevenue = 0
    const totalSubscriptions = activeSubscriptions?.length || 0

    activeSubscriptions?.forEach((sub: any) => {
      const monthlyPrice = sub.tier === 'basic' ? 9.90 : 
                          sub.tier === 'pro' ? 29.90 : 
                          sub.tier === 'enterprise' ? 79.90 : 0
      
      // Add to monthly recurring revenue
      monthlyRecurringRevenue += monthlyPrice
      
      // Calculate total subscription revenue (assuming average subscription age)
      // For now, we'll estimate based on subscription count and average price
      subscriptionRevenue += monthlyPrice
    })

    // Calculate total revenue
    const totalRevenue = tokenRevenue + subscriptionRevenue

    return {
      totalRevenue,
      monthlyRecurringRevenue,
      subscriptionRevenue,
      tokenRevenue,
      totalSubscriptions
    }
  } catch (error) {
    console.error('Error calculating revenue:', error)
    return {
      totalRevenue: 0,
      monthlyRecurringRevenue: 0,
      subscriptionRevenue: 0,
      tokenRevenue: 0,
      totalSubscriptions: 0
    }
  }
} 