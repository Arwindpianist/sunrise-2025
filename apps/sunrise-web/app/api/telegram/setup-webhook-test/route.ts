import { NextResponse } from "next/server"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    console.log("=== WEBHOOK SETUP TEST START ===")
    
    if (!TELEGRAM_BOT_TOKEN) {
      console.error("TELEGRAM_BOT_TOKEN not configured")
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
    console.log("Webhook URL:", webhookUrl)

    // Validate webhook URL
    try {
      new URL(webhookUrl)
      console.log("✅ Webhook URL is valid")
    } catch (error) {
      console.error("❌ Invalid webhook URL:", webhookUrl)
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

    // Test webhook accessibility first
    console.log("Testing webhook accessibility...")
    try {
      const webhookTestResponse = await fetch(webhookUrl, {
        method: "GET",
        headers: {
          "User-Agent": "TelegramBot/1.0"
        }
      })
      
      console.log("Webhook test response:", {
        status: webhookTestResponse.status,
        ok: webhookTestResponse.ok,
        headers: Object.fromEntries(webhookTestResponse.headers.entries())
      })

      if (!webhookTestResponse.ok) {
        throw new Error(`Webhook not accessible: ${webhookTestResponse.status}`)
      }
      
      console.log("✅ Webhook is accessible")
    } catch (error: any) {
      console.error("❌ Webhook accessibility test failed:", error.message)
      return new NextResponse(
        JSON.stringify({ 
          error: "Webhook not accessible",
          details: error.message,
          webhookUrl
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Set the webhook with Telegram
    console.log("Setting up webhook with Telegram...")
    
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
      console.error("❌ Error setting webhook:", responseData)
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

    console.log("✅ Webhook set successfully:", responseData)

    // Get webhook info to verify
    console.log("Getting webhook info to verify...")
    const infoResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`)
    const infoData = await infoResponse.json()
    console.log("Webhook info:", JSON.stringify(infoData, null, 2))

    console.log("=== WEBHOOK SETUP TEST END ===")

    return new NextResponse(
      JSON.stringify({ 
        message: "Webhook set successfully",
        webhookUrl,
        webhookInfo: infoData,
        responseData
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("=== WEBHOOK SETUP TEST ERROR ===")
    console.error("Error setting up webhook:", error)
    console.error("Error stack:", error.stack)
    console.error("Error name:", error.name)
    console.error("=== END ERROR ===")
    
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