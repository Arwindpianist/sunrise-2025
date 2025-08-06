import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

// User IDs to exclude from all calculations (admin/test accounts)
// Temporarily commented out to debug why dashboard shows 0
const EXCLUDED_USER_IDS = [
  // 'dd353545-03e8-43ad-a7a7-0715ebe7d765', // Original excluded user - investigating
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

    // Get detailed subscription analytics
    const analytics = await getSubscriptionAnalytics(supabase)

    return new NextResponse(JSON.stringify(analytics), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Error fetching subscription analytics:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function getSubscriptionAnalytics(supabase: any) {
  try {
    // Get all active subscriptions from user_subscriptions table
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        tier,
        status,
        created_at,
        current_period_start,
        current_period_end,
        total_tokens_purchased
      `)
      .eq('status', 'active')
      .not('user_id', 'in', EXCLUDED_USER_IDS)
      .order('created_at', { ascending: false })

    // Get user details for each subscription
    const userIds = subscriptions?.map((sub: any) => sub.user_id) || []
    const { data: users } = await supabase
      .from('users')
      .select('id, email, full_name, created_at')
      .in('id', userIds)

    // Create user lookup map
    const userMap = new Map()
    users?.forEach((user: any) => {
      userMap.set(user.id, user)
    })

    // Calculate tier breakdown
    const tierBreakdown: { [key: string]: any } = {}
    const tierPricing = {
      basic: 9.90,
      pro: 29.90,
      enterprise: 79.90
    }

    console.log(`Processing ${subscriptions?.length || 0} subscriptions for analytics`)

    subscriptions?.forEach((sub: any) => {
      const tier = sub.tier
      console.log(`Processing subscription: User ${sub.user_id}, Tier: ${tier}`)
      
      if (!tierBreakdown[tier]) {
        tierBreakdown[tier] = {
          count: 0,
          revenue: 0,
          users: [],
          totalTokensPurchased: 0
        }
      }
      
      tierBreakdown[tier].count++
      tierBreakdown[tier].revenue += tierPricing[tier as keyof typeof tierPricing] || 0
      tierBreakdown[tier].totalTokensPurchased += sub.total_tokens_purchased || 0
      
      const user = userMap.get(sub.user_id)
      if (user) {
        tierBreakdown[tier].users.push({
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          subscriptionCreated: sub.created_at,
          tokensPurchased: sub.total_tokens_purchased || 0
        })
      }
    })

    console.log('Tier breakdown:', Object.keys(tierBreakdown).map(tier => ({
      tier,
      count: tierBreakdown[tier].count,
      revenue: tierBreakdown[tier].revenue
    })))

    // Get Stripe data for additional insights
    let stripeData = null
    try {
      stripeData = await getStripeSubscriptionData()
      console.log('Stripe data fetched:', {
        totalSubscriptions: stripeData?.totalSubscriptions,
        totalRevenue: stripeData?.totalRevenue
      })
    } catch (error) {
      console.error('Error fetching Stripe data:', error)
    }

    // Calculate summary statistics
    const totalSubscriptions = subscriptions?.length || 0
    const totalRevenue = Object.values(tierBreakdown).reduce((sum: number, tier: any) => sum + tier.revenue, 0)
    const totalTokensPurchased = Object.values(tierBreakdown).reduce((sum: number, tier: any) => sum + tier.totalTokensPurchased, 0)

    // Get subscription growth over time
    const subscriptionGrowth = await getSubscriptionGrowth(supabase)

    return {
      tierBreakdown,
      summary: {
        totalSubscriptions,
        totalRevenue,
        totalTokensPurchased,
        averageRevenuePerUser: totalSubscriptions > 0 ? totalRevenue / totalSubscriptions : 0,
        averageTokensPerUser: totalSubscriptions > 0 ? totalTokensPurchased / totalSubscriptions : 0
      },
      subscriptionGrowth,
      stripeData,
      lastUpdated: new Date().toISOString()
    }

  } catch (error) {
    console.error('Error in getSubscriptionAnalytics:', error)
    throw error
  }
}

async function getSubscriptionGrowth(supabase: any) {
  try {
    // Get subscriptions created in the last 90 days
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('created_at, tier')
      .gte('created_at', ninetyDaysAgo.toISOString())
      .eq('status', 'active')
      .not('user_id', 'in', EXCLUDED_USER_IDS)
      .order('created_at', { ascending: true })

    // Group by date and tier
    const growthData: { [key: string]: { [key: string]: number } } = {}
    
    subscriptions?.forEach((sub: any) => {
      const date = sub.created_at.split('T')[0]
      const tier = sub.tier
      
      if (!growthData[date]) {
        growthData[date] = {}
      }
      
      if (!growthData[date][tier]) {
        growthData[date][tier] = 0
      }
      
      growthData[date][tier]++
    })

    // Convert to array format for charts
    const data = Object.entries(growthData).map(([date, tiers]) => ({
      date,
      ...tiers
    }))

    return data
  } catch (error) {
    console.error('Error getting subscription growth:', error)
    return []
  }
}

async function getStripeSubscriptionData() {
  try {
    // Get all active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.default_payment_method']
    })

    const stripeSubscriptions = []
    let totalStripeRevenue = 0

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
        
        // Safely convert timestamps with error handling
        let currentPeriodStartISO, currentPeriodEndISO
        try {
          const currentPeriodStart = (subscription as any).current_period_start
          const currentPeriodEnd = (subscription as any).current_period_end
          
          if (currentPeriodStart && currentPeriodEnd) {
            currentPeriodStartISO = new Date(currentPeriodStart * 1000).toISOString()
            currentPeriodEndISO = new Date(currentPeriodEnd * 1000).toISOString()
          } else {
            currentPeriodStartISO = null
            currentPeriodEndISO = null
          }
        } catch (error) {
          console.error('Error converting subscription timestamps:', error)
          currentPeriodStartISO = null
          currentPeriodEndISO = null
        }
        
        stripeSubscriptions.push({
          id: subscription.id,
          customerId: subscription.customer as string,
          status: subscription.status,
          currentPeriodStart: currentPeriodStartISO,
          currentPeriodEnd: currentPeriodEndISO,
          amountPaid,
          currency: latestInvoice.currency
        })
        
        totalStripeRevenue += amountPaid
      }
    }

    return {
      totalSubscriptions: stripeSubscriptions.length,
      totalRevenue: totalStripeRevenue,
      subscriptions: stripeSubscriptions
    }
  } catch (error) {
    console.error('Error fetching Stripe subscription data:', error)
    throw error
  }
} 