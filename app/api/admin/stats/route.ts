import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

// User IDs to exclude from all calculations (admin/test accounts)
const EXCLUDED_USER_IDS = [
  '48227699-4260-448f-b418-e4b48afa9aca'  // Admin user found in logs
]

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

    // Get total users count (excluding the specified users)
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('id', 'eq', EXCLUDED_USER_IDS[0])

    // Get active users (users who signed up in the last 30 days, excluding the specified users)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())
      .not('id', 'eq', EXCLUDED_USER_IDS[0])

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

    // Get total events created (excluding the specified users)
    const { count: totalEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .not('user_id', 'eq', EXCLUDED_USER_IDS[0])

    // Get total contacts (excluding the specified users)
    const { count: totalContacts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .not('user_id', 'eq', EXCLUDED_USER_IDS[0])

    // Get total tokens purchased (excluding the specified users)
    const { data: tokenTransactions } = await supabase
      .from('transactions')
      .select('tokens')
      .eq('type', 'purchase')
      .not('user_id', 'eq', EXCLUDED_USER_IDS[0])

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
      .not('id', 'eq', EXCLUDED_USER_IDS[0])
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
      .not('user_id', 'eq', EXCLUDED_USER_IDS[0])
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
    // Get subscription distribution by tier from users table (excluding the specified users)
    const { data: users } = await supabase
      .from('users')
      .select(`
        subscription_plan,
        id
      `)
      .neq('subscription_plan', 'free')
      .not('id', 'eq', EXCLUDED_USER_IDS[0])
    
    console.log(`Found ${users?.length || 0} users with subscriptions (excluding admin user)`)
    
    const tierCounts: { [key: string]: number } = {}
    
    users?.forEach((user: any) => {
      const tier = user.subscription_plan ? user.subscription_plan.charAt(0).toUpperCase() + user.subscription_plan.slice(1) : 'Unknown'
      tierCounts[tier] = (tierCounts[tier] || 0) + 1
      console.log(`User: ${user.id}, Subscription Plan: ${user.subscription_plan} -> ${tier}`)
    })
    
    console.log('Tier breakdown:', tierCounts)
    
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
    // Get all token purchase transactions (excluding the specified users)
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, type, created_at')
      .eq('type', 'purchase')
      .not('user_id', 'in', EXCLUDED_USER_IDS)

    // Calculate token revenue
    const tokenRevenue = transactions?.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0) || 0

    // Get all users with subscriptions from users table (excluding the specified users)
    const { data: usersWithSubscriptions } = await supabase
      .from('users')
      .select(`
        subscription_plan,
        id,
        created_at
      `)
      .neq('subscription_plan', 'free')
      .not('id', 'eq', EXCLUDED_USER_IDS[0])

    // Calculate subscription revenue from database
    let subscriptionRevenue = 0
    let monthlyRecurringRevenue = 0
    const totalSubscriptions = usersWithSubscriptions?.length || 0

    console.log(`Calculating revenue for ${totalSubscriptions} users with subscriptions`)

    usersWithSubscriptions?.forEach((user: any) => {
      const monthlyPrice = user.subscription_plan === 'basic' ? 9.90 : 
                          user.subscription_plan === 'pro' ? 29.90 : 
                          user.subscription_plan === 'enterprise' ? 79.90 : 0
      
      console.log(`User ${user.id}: Subscription Plan ${user.subscription_plan} = $${monthlyPrice}/month`)
      
      // Add to monthly recurring revenue
      monthlyRecurringRevenue += monthlyPrice
      
      // Calculate total subscription revenue (assuming average subscription age)
      subscriptionRevenue += monthlyPrice
    })

    console.log(`Revenue calculation results:`)
    console.log(`- Total subscriptions: ${totalSubscriptions}`)
    console.log(`- Monthly recurring revenue: $${monthlyRecurringRevenue}`)
    console.log(`- Subscription revenue: $${subscriptionRevenue}`)

    // Try to get actual revenue data from Stripe for reference (but prioritize database calculations)
    try {
      const stripeRevenue = await getStripeRevenue()
      
      // Log Stripe data for comparison but use database calculations for accuracy
      console.log(`Revenue Comparison:`)
      console.log(`- Database Subscription Revenue: $${subscriptionRevenue}`)
      console.log(`- Stripe Subscription Revenue: $${stripeRevenue.subscriptionRevenue}`)
      console.log(`- Database MRR: $${monthlyRecurringRevenue}`)
      console.log(`- Stripe MRR: $${stripeRevenue.monthlyRecurringRevenue}`)
      
      // Note: We prioritize database calculations because they properly exclude the admin user
      // Stripe data includes all subscriptions and can't be filtered by our user IDs
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
    let excludedUserRevenue = 0

    console.log(`Processing ${subscriptions.data.length} Stripe subscriptions`)

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
        
        // Check if this subscription belongs to the excluded user
        // We can't directly filter by user_id in Stripe, so we'll use our database
        // to cross-reference and exclude the admin user's subscriptions
        const subscriptionAmount = amountPaid
        
        // For now, we'll include all Stripe revenue but log for debugging
        // In a production system, you'd want to store Stripe customer IDs in your database
        // to properly link Stripe subscriptions to your users
        subscriptionRevenue += subscriptionAmount
        monthlyRecurringRevenue += subscriptionAmount
        
        console.log(`Subscription ${subscription.id}: $${subscriptionAmount}`)
      }
    }

    // Get all successful payments from Stripe (last 30 days)
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

    console.log(`Stripe Revenue Summary:`)
    console.log(`- Total Revenue (30 days): $${totalRevenue}`)
    console.log(`- Subscription Revenue: $${subscriptionRevenue}`)
    console.log(`- Monthly Recurring Revenue: $${monthlyRecurringRevenue}`)
    console.log(`- Note: Stripe data may include excluded user. Using database calculations for accuracy.`)

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