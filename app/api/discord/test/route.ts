import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { discordTemplates, createDiscordWebhookPayload } from '@/components/discord-templates'

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

    const body = await request.json()
    const { webhookUrl } = body

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

    // Validate webhook URL format (accept both main Discord and PTB domains)
    if (!webhookUrl.startsWith('https://discord.com/api/webhooks/') && 
        !webhookUrl.startsWith('https://ptb.discord.com/api/webhooks/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid Discord webhook URL format. Must start with https://discord.com/api/webhooks/ or https://ptb.discord.com/api/webhooks/' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Test with a birthday template
    const testVars = {
      firstName: 'Test User',
      eventTitle: 'Test Birthday Party',
      eventDescription: 'This is a test event to verify Discord integration',
      eventDate: 'December 25, 2024',
      eventLocation: 'Test Location',
      hostName: 'Sunrise Test'
    }

    const birthdayTemplate = discordTemplates.find(t => t.key === 'birthday')
    if (!birthdayTemplate) {
      return new NextResponse(
        JSON.stringify({ error: 'Template not found' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const embed = birthdayTemplate.template(testVars)
    const discordPayload = createDiscordWebhookPayload(embed, "🎉 **Test Message from Sunrise!**\n\nThis is a test message to verify your Discord webhook is working correctly.")

    // Send test message to Discord
    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload)
    })

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text()
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to send test message to Discord',
          details: errorText,
          status: discordResponse.status
        }),
        { 
          status: discordResponse.status,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Log the test message
    const { error: logError } = await supabase
      .from('discord_logs')
      .insert({
        user_id: session.user.id,
        webhook_url: webhookUrl,
        message_content: JSON.stringify(discordPayload),
        status: 'sent',
        created_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Error logging test message:', logError)
    }

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        message: 'Test message sent successfully to Discord!',
        payload: discordPayload
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error: any) {
    console.error('Error sending test Discord message:', error)
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