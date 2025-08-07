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

    const { webhookUrl, channel } = await request.json()

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

    // Create test Slack message with birthday template
    const testPayload = {
      text: "🎉 **Test Message from Sunrise!**",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🎉 Test Message from Sunrise!",
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "This is a test message to verify your Slack webhook is working correctly.\n\nIf you can see this message, your Slack integration is ready to go!"
          }
        },
        {
          type: "divider"
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "✅ *Slack integration is working perfectly!*"
            }
          ]
        }
      ],
      ...(channel && { channel })
    }

    // Send test message to Slack webhook
    const slackResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
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
          message_content: JSON.stringify(testPayload),
          status: 'failed',
          error_message: errorText,
          created_at: new Date().toISOString()
        })

      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to send test message to Slack',
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
        message_content: JSON.stringify(testPayload),
        status: 'sent',
        created_at: new Date().toISOString()
      })

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        message: 'Test message sent successfully to Slack'
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error: any) {
    console.error('Error sending Slack test message:', error)
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