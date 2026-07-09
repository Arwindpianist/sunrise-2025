import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

    // Get all users
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })

    // Get all subscriptions
    const { data: allSubscriptions } = await supabase
      .from('user_subscriptions')
      .select('user_id, tier, status')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // Get filtered users (excluding admin users)
    const { data: filteredUsers } = await supabase
      .from('users')
      .select('id, email, created_at')
      .not('id', 'in', EXCLUDED_USER_IDS)
      .order('created_at', { ascending: false })

    // Get filtered subscriptions (excluding admin users)
    const { data: filteredSubscriptions } = await supabase
      .from('user_subscriptions')
      .select('user_id, tier, status')
      .eq('status', 'active')
      .not('user_id', 'in', EXCLUDED_USER_IDS)
      .order('created_at', { ascending: false })

    return new NextResponse(JSON.stringify({
      excludedUserIds: EXCLUDED_USER_IDS,
      allUsers: {
        count: allUsers?.length || 0,
        users: allUsers?.map(u => ({ id: u.id, email: u.email })) || []
      },
      filteredUsers: {
        count: filteredUsers?.length || 0,
        users: filteredUsers?.map(u => ({ id: u.id, email: u.email })) || []
      },
      allSubscriptions: {
        count: allSubscriptions?.length || 0,
        subscriptions: allSubscriptions?.map(s => ({ user_id: s.user_id, tier: s.tier })) || []
      },
      filteredSubscriptions: {
        count: filteredSubscriptions?.length || 0,
        subscriptions: filteredSubscriptions?.map(s => ({ user_id: s.user_id, tier: s.tier })) || []
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Error in debug users:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 