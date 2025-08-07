import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { discordTemplates, createDiscordWebhookPayload, DiscordTemplateVars } from '@/components/discord-templates'

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
    const { 
      webhookUrl, 
      templateKey, 
      templateVars, 
      customMessage 
    } = body

    // Validate required fields
    if (!webhookUrl) {
      return new NextResponse(
        JSON.stringify({ error: 'Discord webhook URL is required' }),
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

    // Get user's Discord webhook URL from database
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

    // Use provided webhook URL or fall back to user's saved webhook
    const targetWebhookUrl = webhookUrl || user?.discord_webhook_url

    if (!targetWebhookUrl) {
      return new NextResponse(
        JSON.stringify({ error: 'No Discord webhook URL configured' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Generate Discord message
    let discordPayload

    if (templateKey && templateVars) {
      // Use template
      const template = discordTemplates.find(t => t.key === templateKey)
      if (!template) {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid template key' }),
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      }

      const embed = template.template(templateVars as DiscordTemplateVars)
      discordPayload = createDiscordWebhookPayload(embed, customMessage)
    } else if (customMessage) {
      // Use custom message only
      discordPayload = {
        content: customMessage,
        embeds: []
      }
    } else {
      return new NextResponse(
        JSON.stringify({ error: 'Either template or custom message is required' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Send message to Discord webhook
    const discordResponse = await fetch(targetWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload)
    })

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text()
      console.error('Discord webhook error:', discordResponse.status, errorText)
      
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

    // Log the Discord message
    const { error: logError } = await supabase
      .from('discord_logs')
      .insert({
        user_id: session.user.id,
        webhook_url: targetWebhookUrl,
        message_content: JSON.stringify(discordPayload),
        status: 'sent',
        created_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Error logging Discord message:', logError)
    }

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        message: 'Discord message sent successfully',
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
    console.error('Error sending Discord message:', error)
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