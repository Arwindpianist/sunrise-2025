import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

// User ID to exclude from all calculations
const EXCLUDED_USER_ID = 'dd353545-03e8-43ad-a7a7-0715ebe7d765'

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

    // Get total users count (excluding the specified user)
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .neq('id', EXCLUDED_USER_ID)

    // Get active users (users who signed up in the last 30 days, excluding the specified user)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())
      .neq('id', EXCLUDED_USER_ID)

    // Get comprehensive revenue data from user_subscriptions and Stripe
    const revenueStats = await calculateRevenueFromSubscriptions(supabase)
    const { totalRevenue, monthlyRecurringRevenue, subscriptionRevenue, tokenRevenue, totalSubscriptions } = revenueStats

    // Get total messages sent (email + telegram)
    const { count: emailMessages } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })

    const { count: telegramMessages } = await supabase
      .from('telegram_logs')
      .select('*', { count: 'exact', head: true })

    const totalMessages = (emailMessages || 0) + (telegramMessages || 0)

    // Get total events created (excluding the specified user)
    const { count: totalEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .neq('user_id', EXCLUDED_USER_ID)

    // Get total contacts (excluding the specified user)
    const { count: totalContacts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .neq('user_id', EXCLUDED_USER_ID)

    // Get total tokens purchased (excluding the specified user)
    const { data: tokenTransactions } = await supabase
      .from('transactions')
      .select('tokens')
      .eq('type', 'purchase')
      .neq('user_id', EXCLUDED_USER_ID)

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
    // Get all users created in the last 30 days in one query (excluding the specified user)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: users } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .neq('id', EXCLUDED_USER_ID)
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
    // Get all transactions in the last 30 days in one query (excluding the specified user)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('type', 'purchase')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .neq('user_id', EXCLUDED_USER_ID)
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
  try {
    // Get subscription distribution by tier from user_subscriptions table (excluding the specified user)
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select(`
        tier,
        user_id
      `)
      .eq('status', 'active')
      .neq('tier', 'free')
      .neq('user_id', EXCLUDED_USER_ID)
    
    const tierCounts: { [key: string]: number } = {}
    
    subscriptions?.forEach((sub: any) => {
      const tier = sub.tier ? sub.tier.charAt(0).toUpperCase() + sub.tier.slice(1) : 'Unknown'
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
  } catch (error) {
    console.error('Error generating subscription data:', error)
    return [
      { tier: 'Free', count: 0 },
      { tier: 'Basic', count: 0 },
      { tier: 'Pro', count: 0 },
      { tier: 'Enterprise', count: 0 }
    ]
  }
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

// Comprehensive revenue calculation function using user_subscriptions and Stripe
async function calculateRevenueFromSubscriptions(supabase: any) {
  try {
    // Get all token purchase transactions (excluding the specified user)
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, type, created_at')
      .eq('type', 'purchase')
      .neq('user_id', EXCLUDED_USER_ID)

    // Calculate token revenue
    const tokenRevenue = transactions?.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0) || 0

    // Get all active subscriptions from user_subscriptions table (excluding the specified user)
    const { data: activeSubscriptions } = await supabase
      .from('user_subscriptions')
      .select(`
        tier,
        user_id,
        status,
        created_at,
        current_period_start,
        current_period_end
      `)
      .eq('status', 'active')
      .neq('tier', 'free')
      .neq('user_id', EXCLUDED_USER_ID)

    // Calculate subscription revenue from database
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
      subscriptionRevenue += monthlyPrice
    })

    // Try to get actual revenue data from Stripe for more accuracy
    try {
      const stripeRevenue = await getStripeRevenue()
      
      // Use Stripe data if available, otherwise fall back to database calculations
      if (stripeRevenue.totalRevenue > 0) {
        subscriptionRevenue = stripeRevenue.subscriptionRevenue
        monthlyRecurringRevenue = stripeRevenue.monthlyRecurringRevenue
      }
    } catch (stripeError) {
      console.error('Error fetching Stripe revenue data:', stripeError)
      // Continue with database calculations
    }

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

// Function to get actual revenue data from Stripe
async function getStripeRevenue() {
  try {
    // Get all subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.default_payment_method']
    })

    let subscriptionRevenue = 0
    let monthlyRecurringRevenue = 0

    for (const subscription of subscriptions.data) {
      // Get the latest invoice for this subscription
      const invoices = await stripe.invoices.list({
        subscription: subscription.id,
        limit: 1,
        status: 'paid'
      })

      if (invoices.data.length > 0) {
        const latestInvoice = invoices.data[0]
        const amountPaid = latestInvoice.amount_paid / 100 // Convert from cents to dollars
        
        subscriptionRevenue += amountPaid
        monthlyRecurringRevenue += amountPaid
      }
    }

    // Get all successful payments from Stripe
    const payments = await stripe.paymentIntents.list({
      limit: 100,
      created: {
        gte: Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000) // Last 30 days
      }
    })

    let totalRevenue = 0
    for (const payment of payments.data) {
      if (payment.status === 'succeeded') {
        totalRevenue += payment.amount / 100 // Convert from cents to dollars
      }
    }

    return {
      totalRevenue,
      subscriptionRevenue,
      monthlyRecurringRevenue
    }
  } catch (error) {
    console.error('Error fetching Stripe revenue:', error)
    throw error
  }
} 