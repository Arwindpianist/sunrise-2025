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

    console.log("Setting up webhook URL:", webhookUrl)

    // Set the webhook with Telegram
    const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message"],
        drop_pending_updates: true,
      }),
    })

    const responseData = await telegramResponse.json()

    if (!telegramResponse.ok) {
      console.error("Error setting webhook:", responseData)
      return new NextResponse(
        JSON.stringify({ 
          error: "Failed to set webhook",
          details: responseData
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
    return new NextResponse(
      JSON.stringify({ error: "Internal server error", details: error.message }),
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