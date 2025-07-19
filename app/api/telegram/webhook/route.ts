import { NextResponse } from "next/server"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Log the incoming webhook for debugging
    console.log("Telegram webhook received:", JSON.stringify(body, null, 2))

    // Extract the message data
    const { message } = body
    
    if (!message) {
      return new NextResponse(
        JSON.stringify({ status: "ok", message: "No message data" }),
        { 
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const { chat, text, from } = message
    const chatId = chat.id
    const chatType = chat.type
    const userName = from?.first_name || "User"
    const username = from?.username

    console.log(`Message from ${userName} (${username}) in chat ${chatId}: ${text}`)

    // Handle different types of messages
    let responseText = ""

    if (text?.toLowerCase().includes("/start") || text?.toLowerCase().includes("hello") || text?.toLowerCase().includes("hi")) {
      responseText = `👋 Hello ${userName}! 

Your Telegram Chat ID is: **${chatId}**

📋 **How to use this Chat ID:**
1. Copy the number above: ${chatId}
2. Go back to the contact form
3. Paste it in the "Telegram Chat ID" field
4. Submit the form

✅ Once added, you'll receive event invitations and updates via Telegram!

💡 **Your Chat ID is unique to your Telegram account and this bot.**`
    } else if (text?.toLowerCase().includes("chat id") || text?.toLowerCase().includes("id")) {
      responseText = `🔍 Your Telegram Chat ID is: **${chatId}**

Copy this number and use it in the contact form to receive Telegram messages.`
    } else if (text?.toLowerCase().includes("help")) {
      responseText = `🤖 **Sunrise 2025 Bot Help**

**Commands:**
• /start - Get your Chat ID
• /help - Show this help message
• "hello" - Get your Chat ID
• "chat id" - Get your Chat ID

**What is a Chat ID?**
Your Chat ID (${chatId}) is a unique number that allows us to send you messages. It's like your Telegram address for this bot.

**How to use it:**
1. Copy your Chat ID: ${chatId}
2. Paste it in the contact form
3. You'll receive event invitations via Telegram!`
    } else {
      // Default response for any other message
      responseText = `Hi ${userName}! 👋

Your Telegram Chat ID is: **${chatId}**

📝 **To receive event invitations:**
1. Copy this number: ${chatId}
2. Go to the contact form
3. Paste it in the "Telegram Chat ID" field
4. Submit the form

Need help? Send "help" for more information.`
    }

    // Send response back to Telegram
    const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: responseText,
        parse_mode: "Markdown",
      }),
    })

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json()
      console.error("Error sending Telegram response:", errorData)
    } else {
      console.log(`Response sent successfully to chat ${chatId}`)
    }

    return new NextResponse(
      JSON.stringify({ status: "ok", message: "Webhook processed successfully" }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("Error processing Telegram webhook:", error)
    return new NextResponse(
      JSON.stringify({ 
        status: "error", 
        message: "Error processing webhook",
        error: error.message 
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

// Handle GET requests (for webhook verification)
export async function GET(request: Request) {
  return new NextResponse(
    JSON.stringify({ 
      status: "ok", 
      message: "Telegram Webhook Endpoint",
      timestamp: new Date().toISOString()
    }),
    { 
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  )
} 