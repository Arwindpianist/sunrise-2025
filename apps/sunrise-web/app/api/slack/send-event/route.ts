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

    // Check if Slack is enabled for this event
    if (!event.send_slack) {
      return new NextResponse(
        JSON.stringify({ error: 'Slack is not enabled for this event' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Get user's Slack webhook URL
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('slack_webhook_url, slack_channel')
      .eq('id', session.user.id)
      .single()

    if (userError) {
      console.error('Error fetching user Slack webhook:', userError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch user Slack settings' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    if (!user?.slack_webhook_url) {
      return new NextResponse(
        JSON.stringify({ error: 'No Slack webhook URL configured. Please set up Slack integration in settings.' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Parse Slack template
    let slackPayload
    try {
      if (event.slack_template) {
        slackPayload = JSON.parse(event.slack_template)
      } else {
        // Fallback to a simple message if no template
        slackPayload = {
          text: `🎉 *${event.title}*\n\n${event.description || 'You\'re invited to an event!'}\n\n📅 **Date:** ${new Date(event.event_date).toLocaleDateString()}\n📍 **Location:** ${event.location || 'TBA'}\n\nBest regards,\nSunrise Events`
        }
      }
    } catch (error) {
      console.error('Error parsing Slack template:', error)
      return new NextResponse(
        JSON.stringify({ error: 'Invalid Slack template format' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Add channel to payload if specified
    if (user.slack_channel) {
      slackPayload.channel = user.slack_channel
    }

    // Send message to Slack webhook
    const slackResponse = await fetch(user.slack_webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackPayload)
    })

    if (!slackResponse.ok) {
      const errorText = await slackResponse.text()
      console.error('Slack webhook error:', slackResponse.status, errorText)
      
      // Log the failed Slack message
      await supabase
        .from('slack_logs')
        .insert({
          user_id: session.user.id,
          webhook_url: user.slack_webhook_url,
          channel: user.slack_channel,
          message_content: JSON.stringify(slackPayload),
          status: 'failed',
          error_message: errorText,
          created_at: new Date().toISOString()
        })

      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to send Slack message',
          details: errorText
        }),
        { 
          status: slackResponse.status,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Log the successful Slack message
    await supabase
      .from('slack_logs')
      .insert({
        user_id: session.user.id,
        webhook_url: user.slack_webhook_url,
        channel: user.slack_channel,
        message_content: JSON.stringify(slackPayload),
        status: 'sent',
        created_at: new Date().toISOString()
      })

    // Update event contacts status for Slack (mark all as sent since it's one message)
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

    // Create transaction record for Slack message (1 token cost)
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: session.user.id,
        type: 'usage',
        amount: -1, // Slack costs 1 token
        description: `Slack message for event: ${event.title}`,
        status: 'completed',
        created_at: new Date().toISOString()
      })

    if (transactionError) {
      console.error('Error creating Slack transaction:', transactionError)
    }

    // Update user balance (deduct 1 token for Slack)
    const { data: currentBalance, error: balanceFetchError } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('user_id', session.user.id)
      .single()

    if (!balanceFetchError && currentBalance) {
      const { error: balanceError } = await supabase
        .from('user_balances')
        .update({ 
          balance: currentBalance.balance - 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id)

      if (balanceError) {
        console.error('Error updating user balance for Slack:', balanceError)
      }
    }

    // Update event status to sent
    const { error: eventUpdateError } = await supabase
      .from('events')
      .update({ 
        status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)

    if (eventUpdateError) {
      console.error('Error updating event status for Slack:', eventUpdateError)
    }

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        message: 'Slack message sent successfully',
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
    console.error('Error sending Slack event message:', error)
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