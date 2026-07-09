import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

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

    if (!TELEGRAM_CHAT_ID) {
      return new NextResponse(
        JSON.stringify({ error: "TELEGRAM_CHAT_ID not configured" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Test message
    const testMessage = `🧪 Test message from Sunrise 2025!

This is a test to verify Telegram integration is working.

Time: ${new Date().toLocaleString()}
User: ${session.user.email}`

    console.log("Sending test message to chat_id:", TELEGRAM_CHAT_ID)
    console.log("Message:", testMessage)

    // Send test message via Telegram Bot API
    const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: testMessage,
        parse_mode: "HTML",
      }),
    })

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json()
      console.error("Telegram API error:", errorData)
      return new NextResponse(
        JSON.stringify({ 
          error: "Failed to send test message",
          details: errorData,
          status: telegramResponse.status
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const responseData = await telegramResponse.json()
    console.log("Telegram API response:", responseData)

    return new NextResponse(
      JSON.stringify({ 
        message: "Test message sent successfully",
        response: responseData
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("Error in Telegram test:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
} 