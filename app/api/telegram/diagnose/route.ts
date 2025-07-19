import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      domain: request.headers.get('host'),
      protocol: request.headers.get('x-forwarded-proto') || 'http',
    }

    // Check if bot token is configured
    if (!TELEGRAM_BOT_TOKEN) {
      diagnostics.botToken = {
        status: "missing",
        error: "TELEGRAM_BOT_TOKEN environment variable is not set"
      }
    } else {
      diagnostics.botToken = {
        status: "configured",
        tokenPreview: `${TELEGRAM_BOT_TOKEN.substring(0, 10)}...${TELEGRAM_BOT_TOKEN.substring(TELEGRAM_BOT_TOKEN.length - 4)}`
      }
    }

    // Check if we're on HTTPS
    const isHttps = request.headers.get('x-forwarded-proto') === 'https' || 
                   request.headers.get('x-forwarded-proto') === 'https,http'
    
    diagnostics.https = {
      status: isHttps ? "enabled" : "disabled",
      warning: isHttps ? null : "Telegram requires HTTPS for webhooks"
    }

    // Test bot token validity
    if (TELEGRAM_BOT_TOKEN) {
      try {
        const botInfoResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`)
        const botInfo = await botInfoResponse.json()
        
        if (botInfoResponse.ok && botInfo.ok) {
          diagnostics.botInfo = {
            status: "valid",
            username: botInfo.result.username,
            first_name: botInfo.result.first_name,
            can_join_groups: botInfo.result.can_join_groups,
            can_read_all_group_messages: botInfo.result.can_read_all_group_messages,
            supports_inline_queries: botInfo.result.supports_inline_queries
          }
        } else {
          diagnostics.botInfo = {
            status: "invalid",
            error: botInfo.description || "Failed to get bot info"
          }
        }
      } catch (error: any) {
        diagnostics.botInfo = {
          status: "error",
          error: error.message
        }
      }
    }

    // Get current webhook info
    if (TELEGRAM_BOT_TOKEN) {
      try {
        const webhookInfoResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`)
        const webhookInfo = await webhookInfoResponse.json()
        
        diagnostics.webhookInfo = webhookInfo
      } catch (error: any) {
        diagnostics.webhookInfo = {
          status: "error",
          error: error.message
        }
      }
    }

    // Test webhook URL accessibility
    const { origin } = new URL(request.url)
    const webhookUrl = `${origin}/api/telegram/webhook`
    
    try {
      const webhookTestResponse = await fetch(webhookUrl, {
        method: "GET",
        headers: {
          "User-Agent": "TelegramBot/1.0"
        }
      })
      
      diagnostics.webhookAccessibility = {
        status: webhookTestResponse.ok ? "accessible" : "not_accessible",
        statusCode: webhookTestResponse.status,
        url: webhookUrl
      }
    } catch (error: any) {
      diagnostics.webhookAccessibility = {
        status: "error",
        error: error.message,
        url: webhookUrl
      }
    }

    // Check if we're on a local development environment
    const isLocalhost = request.headers.get('host')?.includes('localhost') || 
                       request.headers.get('host')?.includes('127.0.0.1')
    
    diagnostics.environment = {
      isLocalhost,
      isProduction: process.env.NODE_ENV === 'production',
      warning: isLocalhost ? "Webhooks won't work on localhost. Use ngrok or deploy to production." : null
    }

    return new NextResponse(
      JSON.stringify(diagnostics, null, 2),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("Error in diagnostics:", error)
    return new NextResponse(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
} 