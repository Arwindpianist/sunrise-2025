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
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

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

    // First, let's check what event contacts exist for this event (any status)
    const { data: allEventContacts, error: allEventContactsError } = await supabase
      .from("event_contacts")
      .select(`
        *,
        contacts (
          id,
          telegram_chat_id,
          first_name,
          last_name
        )
      `)
      .eq("event_id", eventId)

    if (allEventContactsError) {
      console.error("Error fetching all event contacts:", allEventContactsError)
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

    console.log(`Found ${allEventContacts?.length || 0} total event contacts for event ${eventId}`)
    console.log("Event contacts statuses:", allEventContacts?.map(ec => ({ 
      contact_id: ec.contact_id, 
      status: ec.status,
      telegram_chat_id: ec.contacts?.telegram_chat_id 
    })))

    // If no event contacts exist at all, we need to create them
    if (!allEventContacts || allEventContacts.length === 0) {
      console.log("No event contacts found. Creating event contacts for this event...")
      
      // Get event details to understand the category filter
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

      // Get contacts for the event based on the event's category
      let contactsQuery = supabase
        .from("contacts")
        .select("*")
        .eq("user_id", session.user.id)

      // Filter by category if event has a category (no category means "all")
      // Note: "general" category means "all contacts", so don't filter
      if (event.category && event.category !== "general") {
        // Try to use the new multiple categories system first
        const { data: categoryContacts, error: categoryError } = await supabase
          .from('contact_category_assignments')
          .select(`
            contact_id,
            contact_categories!inner (
              name
            )
          `)
          .eq('contact_categories.name', event.category)
          .eq('contacts.user_id', session.user.id)

        if (!categoryError && categoryContacts && categoryContacts.length > 0) {
          // Use the new system - filter by contact IDs
          const contactIds = categoryContacts.map((cca: any) => cca.contact_id)
          contactsQuery = contactsQuery.in('id', contactIds)
        } else {
          // Fallback to old single category system
          contactsQuery = contactsQuery.eq("category", event.category)
        }
      }

      const { data: contacts, error: contactsError } = await contactsQuery

      if (contactsError) {
        console.error("Error fetching contacts:", contactsError)
        return new NextResponse(
          JSON.stringify({ error: "Failed to fetch contacts" }),
          { 
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      }

      console.log(`Found ${contacts?.length || 0} contacts for event category: ${event.category || 'all'}`)

      if (!contacts || contacts.length === 0) {
        console.log("No contacts found for this event")
        return new NextResponse(
          JSON.stringify({ error: "No contacts found for this event" }),
          { 
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      }

      // Create event contacts
      const eventContacts = contacts.map((contact) => ({
        event_id: eventId,
        contact_id: contact.id,
        status: "pending",
      }))

      const { error: eventContactsError } = await supabase
        .from("event_contacts")
        .insert(eventContacts)

      if (eventContactsError) {
        console.error("Error creating event contacts:", eventContactsError)
        return new NextResponse(
          JSON.stringify({ error: "Failed to create event contacts" }),
          { 
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      }

      console.log(`Created ${eventContacts.length} event contacts`)
    }

    // Get pending event contacts with telegram chat IDs
    const { data: eventContacts, error: eventContactsError } = await supabase
      .from("event_contacts")
      .select(`
        *,
        contacts (
          id,
          telegram_chat_id,
          first_name,
          last_name
        )
      `)
      .eq("event_id", eventId)
      .eq("status", "pending")
      .not("contacts.telegram_chat_id", "is", null)

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

    console.log(`Found ${eventContacts?.length || 0} pending event contacts with telegram chat IDs for event ${eventId}`)

    // If no pending contacts found, check if we should process sent contacts (for retry scenarios)
    let contactsToProcess = eventContacts
    if (!eventContacts || eventContacts.length === 0) {
      console.log("No pending contacts found, checking for sent contacts that might need retry...")
      
      // Get sent event contacts with telegram chat IDs
      const { data: sentEventContacts, error: sentEventContactsError } = await supabase
        .from("event_contacts")
        .select(`
          *,
          contacts (
            id,
            telegram_chat_id,
            first_name,
            last_name
          )
        `)
        .eq("event_id", eventId)
        .eq("status", "sent")
        .not("contacts.telegram_chat_id", "is", null)

      if (sentEventContactsError) {
        console.error("Error fetching sent event contacts:", sentEventContactsError)
      } else {
        console.log(`Found ${sentEventContacts?.length || 0} sent event contacts with telegram chat IDs`)
        contactsToProcess = sentEventContacts || []
      }
    }

    // Send Telegram messages to each contact
    for (const eventContact of contactsToProcess) {
      try {
        const contact = eventContact.contacts
        console.log(`Sending Telegram message to chat_id: ${contact.telegram_chat_id} for event ${eventId}`)
        
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

        // Use the contact's telegram chat ID
        const chatId = contact.telegram_chat_id
        
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

        console.log(`Telegram message sent successfully to chat_id: ${contact.telegram_chat_id}`)

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