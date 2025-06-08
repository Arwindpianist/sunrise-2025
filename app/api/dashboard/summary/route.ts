import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (userError) {
      console.error('Error fetching user:', userError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch user data' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Get event count
    const { count: eventCount, error: eventError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    if (eventError) {
      console.error('Error fetching event count:', eventError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch event count' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Get contact count
    const { count: contactCount, error: contactError } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    if (contactError) {
      console.error('Error fetching contact count:', contactError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch contact count' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    return new NextResponse(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          created_at: user.created_at,
        },
        stats: {
          events: eventCount || 0,
          contacts: contactCount || 0,
        },
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('Error in dashboard summary:', error)
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