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

    // Get recent events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (eventsError) {
      console.error('Error fetching events:', eventsError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch events' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Get recent contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch contacts' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Combine and format activities
    const activities = [
      ...events.map(event => ({
        id: event.id,
        type: 'event_created',
        title: event.title,
        created_at: event.created_at,
      })),
      ...contacts.map(contact => ({
        id: contact.id,
        type: 'contact_added',
        title: `${contact.first_name} ${contact.last_name}`,
        created_at: contact.created_at,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

    return new NextResponse(
      JSON.stringify(activities),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('Error in dashboard activity:', error)
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