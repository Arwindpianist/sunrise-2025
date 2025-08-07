import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
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

    const { eventId } = await request.json()

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError) {
      console.error('Error fetching event:', eventError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch event' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Check if Discord is enabled for this event
    if (!event.send_discord) {
      return new NextResponse(
        JSON.stringify({ error: 'Discord is not enabled for this event' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Get user's Discord webhook URL
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('discord_webhook_url')
      .eq('id', session.user.id)
      .single()

    if (userError) {
      console.error('Error fetching user Discord webhook:', userError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch user Discord settings' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    if (!user?.discord_webhook_url) {
      return new NextResponse(
        JSON.stringify({ error: 'No Discord webhook URL configured. Please set up Discord integration in settings.' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Parse Discord template
    let discordPayload
    try {
      if (event.discord_template) {
        discordPayload = JSON.parse(event.discord_template)
      } else {
        // Fallback to a simple message if no template
        discordPayload = {
          content: `🎉 **${event.title}**\n\n${event.description || 'You\'re invited to an event!'}\n\n📅 **Date:** ${new Date(event.event_date).toLocaleDateString()}\n📍 **Location:** ${event.location || 'TBA'}\n\nBest regards,\nSunrise Events`
        }
      }
    } catch (error) {
      console.error('Error parsing Discord template:', error)
      return new NextResponse(
        JSON.stringify({ error: 'Invalid Discord template format' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Send message to Discord webhook
    const discordResponse = await fetch(user.discord_webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload)
    })

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text()
      console.error('Discord webhook error:', discordResponse.status, errorText)
      
      // Log the failed Discord message
      await supabase
        .from('discord_logs')
        .insert({
          user_id: session.user.id,
          webhook_url: user.discord_webhook_url,
          message_content: JSON.stringify(discordPayload),
          status: 'failed',
          error_message: errorText,
          created_at: new Date().toISOString()
        })

      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to send Discord message',
          details: errorText
        }),
        { 
          status: discordResponse.status,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Log the successful Discord message
    await supabase
      .from('discord_logs')
      .insert({
        user_id: session.user.id,
        webhook_url: user.discord_webhook_url,
        message_content: JSON.stringify(discordPayload),
        status: 'sent',
        created_at: new Date().toISOString()
      })

    // Update event contacts status for Discord (mark all as sent since it's one message)
    const { data: eventContacts, error: eventContactsError } = await supabase
      .from('event_contacts')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'pending')

    if (!eventContactsError && eventContacts) {
      // Update all pending event contacts to sent
      const updatePromises = eventContacts.map(eventContact =>
        supabase
          .from('event_contacts')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', eventContact.id)
      )

      await Promise.all(updatePromises)
    }

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        message: 'Discord message sent successfully',
        contactsReached: eventContacts?.length || 0
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error: any) {
    console.error('Error sending Discord event message:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
} 