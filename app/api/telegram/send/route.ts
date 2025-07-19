import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

// Check if Telegram Bot token is configured
if (!TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is not configured")
}

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Session error:", sessionError)
      return new NextResponse(
        JSON.stringify({ error: "Failed to get session" }),
        { 
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    }

    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    }

    const { eventId } = await request.json()

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single()

    if (eventError) {
      console.error("Error fetching event:", eventError)
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch event" }),
        { 
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    }

    // Check if event has telegram template
    if (!event.telegram_template) {
      return new NextResponse(
        JSON.stringify({ error: "No Telegram template found for this event" }),
        { 
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    }

    // Get pending event contacts with phone numbers
    const { data: eventContacts, error: eventContactsError } = await supabase
      .from("event_contacts")
      .select(`
        *,
        contacts (
          id,
          phone,
          first_name,
          last_name
        )
      `)
      .eq("event_id", eventId)
      .eq("status", "pending")
      .not("contacts.phone", "is", null)

    if (eventContactsError) {
      console.error("Error fetching event contacts:", eventContactsError)
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch event contacts" }),
        { 
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    }

    console.log(`Found ${eventContacts?.length || 0} pending event contacts with phone numbers for event ${eventId}`)

    // Send Telegram messages to each contact
    for (const eventContact of eventContacts) {
      try {
        const contact = eventContact.contacts
        console.log(`Sending Telegram message to ${contact.phone} for event ${eventId}`)
        
        // Format event date properly
        const eventDate = new Date(event.event_date)
        const formattedEventDate = eventDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })

        const telegramMessage = event.telegram_template
          .replace(/\{\{firstName\}\}/g, contact.first_name || "")
          .replace(/\{\{lastName\}\}/g, contact.last_name || "")
          .replace(/\{\{eventTitle\}\}/g, event.title)
          .replace(/\{\{eventDescription\}\}/g, event.description || "")
          .replace(/\{\{eventDate\}\}/g, formattedEventDate)
          .replace(/\{\{eventLocation\}\}/g, event.location || "")
          .replace(/\{\{hostName\}\}/g, session.user.user_metadata?.full_name || "Your Host")
          .replace(/\{\{customMessage\}\}/g, event.description || "")

        // For now, we'll use a test approach - send to the configured chat ID
        // In production, you would need to store actual Telegram chat IDs for each contact
        const chatId = TELEGRAM_CHAT_ID || contact.phone
        
        console.log(`Attempting to send Telegram message to chat_id: ${chatId}`)
        console.log(`Message content: ${telegramMessage}`)

        // Send message via Telegram Bot API
        const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: telegramMessage,
            parse_mode: "HTML",
          }),
        })

        if (!telegramResponse.ok) {
          const errorData = await telegramResponse.json()
          console.error("Telegram API error:", errorData)
          console.error("Response status:", telegramResponse.status)
          console.error("Response headers:", Object.fromEntries(telegramResponse.headers.entries()))
          throw new Error(`Telegram API error: ${errorData.description || 'Unknown error'} (Status: ${telegramResponse.status})`)
        }

        const responseData = await telegramResponse.json()
        console.log("Telegram API response:", responseData)

        console.log(`Telegram message sent successfully to ${contact.phone}`)

        // Update event contact status
        const { error: updateError } = await supabase
          .from("event_contacts")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", eventContact.id)

        if (updateError) {
          throw updateError
        }

        // Create telegram log
        const { error: logError } = await supabase
          .from("telegram_logs")
          .insert({
            event_id: eventId,
            contact_id: contact.id,
            status: "sent",
          })

        if (logError) {
          throw logError
        }
      } catch (error: any) {
        console.error("Error sending Telegram message to contact:", error)

        // Update event contact status to failed
        await supabase
          .from("event_contacts")
          .update({
            status: "failed",
          })
          .eq("id", eventContact.id)

        // Create telegram log with error
        await supabase
          .from("telegram_logs")
          .insert({
            event_id: eventId,
            contact_id: eventContact.contacts.id,
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
          })
      }
    }

    // Check if all messages have been sent
    const { count: pendingCount } = await supabase
      .from("event_contacts")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "pending")

    // If no pending messages, update event status to sent
    if (pendingCount === 0) {
      const { error: updateError } = await supabase
        .from("events")
        .update({ status: "sent" })
        .eq("id", eventId)

      if (updateError) {
        console.error("Error updating event status:", updateError)
      }
    }

    return new NextResponse(
      JSON.stringify({ message: "Telegram messages sent successfully" }),
      { 
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  } catch (error: any) {
    console.error("Error in Telegram sending:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }
} 