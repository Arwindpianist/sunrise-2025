import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
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

    if (!TELEGRAM_BOT_TOKEN) {
      return new NextResponse(
        JSON.stringify({ error: "TELEGRAM_BOT_TOKEN not configured" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Get the webhook URL
    const { origin } = new URL(request.url)
    const webhookUrl = `${origin}/api/telegram/webhook`

    console.log("Request URL:", request.url)
    console.log("Origin:", origin)
    console.log("Setting up webhook URL:", webhookUrl)

    // Validate webhook URL
    try {
      new URL(webhookUrl)
    } catch (error) {
      console.error("Invalid webhook URL:", webhookUrl)
      return new NextResponse(
        JSON.stringify({ 
          error: "Invalid webhook URL",
          webhookUrl,
          details: error instanceof Error ? error.message : "URL validation failed"
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Set the webhook with Telegram
    console.log("Attempting to set webhook with URL:", webhookUrl)
    
    const webhookPayload = {
      url: webhookUrl,
      allowed_updates: ["message"],
      drop_pending_updates: true,
    }
    
    console.log("Webhook payload:", JSON.stringify(webhookPayload, null, 2))
    
    const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    })

    console.log("Telegram response status:", telegramResponse.status)
    console.log("Telegram response headers:", Object.fromEntries(telegramResponse.headers.entries()))

    const responseData = await telegramResponse.json()
    console.log("Telegram response data:", JSON.stringify(responseData, null, 2))

    if (!telegramResponse.ok) {
      console.error("Error setting webhook:", responseData)
      return new NextResponse(
        JSON.stringify({ 
          error: "Failed to set webhook",
          details: responseData,
          status: telegramResponse.status,
          webhookUrl
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    console.log("Webhook set successfully:", responseData)

    // Get webhook info to verify
    const infoResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`)
    const infoData = await infoResponse.json()

    return new NextResponse(
      JSON.stringify({ 
        message: "Webhook set successfully",
        webhookUrl,
        webhookInfo: infoData
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("Error setting up webhook:", error)
    console.error("Error stack:", error.stack)
    return new NextResponse(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message,
        stack: error.stack,
        name: error.name
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

export async function GET(request: Request) {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return new NextResponse(
        JSON.stringify({ error: "TELEGRAM_BOT_TOKEN not configured" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Get current webhook info
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`)
    const data = await response.json()

    return new NextResponse(
      JSON.stringify(data),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("Error getting webhook info:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
} 