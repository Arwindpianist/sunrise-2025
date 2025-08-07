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

    const { webhookUrl, customMessage, channel } = await request.json()

    if (!webhookUrl) {
      return new NextResponse(
        JSON.stringify({ error: 'Webhook URL is required' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Validate webhook URL format
    if (!webhookUrl.startsWith('https://hooks.slack.com/services/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid Slack webhook URL format. Must start with https://hooks.slack.com/services/' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Create Slack message payload
    const slackPayload = {
      text: customMessage || "🎉 **Test Message from Sunrise!**\n\nThis is a test message to verify your Slack webhook is working correctly.\n\nIf you can see this message, your Slack integration is ready to go!",
      ...(channel && { channel })
    }

    // Send message to Slack webhook
    const slackResponse = await fetch(webhookUrl, {
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
          webhook_url: webhookUrl,
          channel: channel || null,
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
        webhook_url: webhookUrl,
        channel: channel || null,
        message_content: JSON.stringify(slackPayload),
        status: 'sent',
        created_at: new Date().toISOString()
      })

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        message: 'Slack message sent successfully'
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error: any) {
    console.error('Error sending Slack message:', error)
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