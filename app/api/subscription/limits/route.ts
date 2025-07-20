import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SubscriptionTier, SUBSCRIPTION_FEATURES, hasReachedContactLimit, hasReachedEventLimit } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

// Get user's current subscription tier
async function getUserSubscriptionTier(supabase: any, userId: string): Promise<SubscriptionTier> {
  try {
    // Check for any subscription first - use the same pattern as the subscription API
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('tier, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error)
    }

    if (subscription) {
      return subscription.tier as SubscriptionTier
    }

    // Check if user has any subscription at all (not just inactive)
    const { data: anySubscription } = await supabase
      .from('user_subscriptions')
      .select('tier, status')
      .eq('user_id', userId)
      .single()

    if (anySubscription) {
      return anySubscription.tier as SubscriptionTier
    }

    // Check if user is in trial period
    const { data: profile } = await supabase.auth.getUser()
    if (profile.user) {
      const createdAt = new Date(profile.user.created_at)
      const now = new Date()
      const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceCreation <= 30) {
        return 'free' // Trial period
      }
    }
    
    return 'free' // No subscription
  } catch (error) {
    console.error('Error getting user subscription tier:', error)
    return 'free'
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to get session' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'contacts' or 'events'

    if (!type || (type !== 'contacts' && type !== 'events')) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid type parameter. Must be "contacts" or "events"' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const tier = await getUserSubscriptionTier(supabase, session.user.id)
    
    // Get current count
    const tableName = type === 'contacts' ? 'contacts' : 'events'
    const { count: currentCount, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    if (error) {
      console.error(`Error counting ${type}:`, error)
      return new NextResponse(
        JSON.stringify({ error: `Failed to count ${type}` }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const maxAllowed = type === 'contacts' 
      ? SUBSCRIPTION_FEATURES[tier].maxContacts 
      : SUBSCRIPTION_FEATURES[tier].maxEvents

    const allowed = type === 'contacts'
      ? !hasReachedContactLimit(tier, currentCount || 0)
      : !hasReachedEventLimit(tier, currentCount || 0)

    return new NextResponse(
      JSON.stringify({
        allowed,
        currentCount: currentCount || 0,
        maxAllowed,
        tier,
        limitInfo: {
          current: currentCount || 0,
          max: maxAllowed === -1 ? 'Unlimited' : maxAllowed,
          remaining: maxAllowed === -1 ? 'Unlimited' : Math.max(0, maxAllowed - (currentCount || 0)),
          percentage: maxAllowed === -1 ? 0 : Math.min(100, ((currentCount || 0) / maxAllowed) * 100),
          isUnlimited: maxAllowed === -1
        }
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('Error in subscription limits:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
} 