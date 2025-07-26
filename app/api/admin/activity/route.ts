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

    // Get recent user signups
    const { data: recentUsers } = await supabase
      .from('users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    // Get recent subscriptions with user emails
    const { data: recentSubscriptions } = await supabase
      .from('user_subscriptions')
      .select(`
        user_id,
        tier,
        created_at,
        users!inner(email)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get recent messages with user emails
    const { data: recentEmails } = await supabase
      .from('email_logs')
      .select(`
        user_id,
        created_at,
        users!inner(email)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recentTelegram } = await supabase
      .from('telegram_logs')
      .select(`
        user_id,
        created_at,
        users!inner(email)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get recent events with user emails
    const { data: recentEvents } = await supabase
      .from('events')
      .select(`
        user_id,
        title,
        created_at,
        users!inner(email)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    // Combine and format activity data
    const activities: any[] = []

    // Add user signups
    recentUsers?.forEach(user => {
      activities.push({
        id: `user_${user.id}`,
        type: 'user_signup' as const,
        user_email: user.email,
        description: 'New user signed up',
        created_at: user.created_at
      })
    })

    // Add subscriptions
    recentSubscriptions?.forEach(sub => {
      activities.push({
        id: `sub_${sub.user_id}_${sub.created_at}`,
        type: 'subscription' as const,
        user_email: (sub.users as any)?.email || 'Unknown',
        description: `Upgraded to ${sub.tier} plan`,
        created_at: sub.created_at
      })
    })

    // Add email messages
    recentEmails?.forEach(email => {
      activities.push({
        id: `email_${email.user_id}_${email.created_at}`,
        type: 'message_sent' as const,
        user_email: (email.users as any)?.email || 'Unknown',
        description: 'Sent email message',
        created_at: email.created_at
      })
    })

    // Add telegram messages
    recentTelegram?.forEach(tg => {
      activities.push({
        id: `telegram_${tg.user_id}_${tg.created_at}`,
        type: 'message_sent' as const,
        user_email: (tg.users as any)?.email || 'Unknown',
        description: 'Sent Telegram message',
        created_at: tg.created_at
      })
    })

    // Add events
    recentEvents?.forEach(event => {
      activities.push({
        id: `event_${event.user_id}_${event.created_at}`,
        type: 'event_created' as const,
        user_email: (event.users as any)?.email || 'Unknown',
        description: `Created event: ${event.title}`,
        created_at: event.created_at
      })
    })

    // Sort by created_at and limit to 20 most recent
    const sortedActivities = activities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20)

    return new NextResponse(JSON.stringify(sortedActivities), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Error fetching activity:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 