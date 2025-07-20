import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@sunrise-2025.com"

// Check if Resend API key is configured
if (!process.env.RESEND_API_KEY) {
  console.error("RESEND_API_KEY is not configured")
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

    // Get pending event contacts
    const { data: eventContacts, error: eventContactsError } = await supabase
      .from("event_contacts")
      .select(`
        *,
        contacts (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq("event_id", eventId)
      .eq("status", "pending")

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

    console.log(`Found ${eventContacts?.length || 0} pending event contacts for event ${eventId}`)

    // Send emails to each contact
    for (const eventContact of eventContacts) {
      try {
        const contact = eventContact.contacts
        console.log(`Sending email to ${contact.email} for event ${eventId}`)
        
        const emailTemplate = event.email_template
          .replace("{{firstName}}", contact.first_name || "")
          .replace("{{lastName}}", contact.last_name || "")
          .replace("{{eventTitle}}", event.title)
          .replace("{{eventDate}}", new Date(event.event_date).toLocaleDateString())
          .replace("{{eventLocation}}", event.location || "")

        const { data: emailData, error: emailError } = await resend.emails.send({
          from: `Sunrise <${FROM_EMAIL}>`,
          to: contact.email,
          subject: event.email_subject,
          html: emailTemplate,
        })

        if (emailError) {
          console.error("Resend error:", emailError)
          throw emailError
        }

        console.log(`Email sent successfully to ${contact.email}`)

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

        // Create email log
        const { error: logError } = await supabase
          .from("email_logs")
          .insert({
            event_id: eventId,
            contact_id: contact.id,
            status: "sent",
          })

        if (logError) {
          throw logError
        }
      } catch (error) {
        console.error("Error sending email to contact:", error)

        // Update event contact status to failed
        await supabase
          .from("event_contacts")
          .update({
            status: "failed",
          })
          .eq("id", eventContact.id)

        // Create email log with error
        await supabase
          .from("email_logs")
          .insert({
            event_id: eventId,
            contact_id: eventContact.contacts.id,
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
          })
      }
    }

    // Check if all emails have been sent
    const { count: pendingCount } = await supabase
      .from("event_contacts")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "pending")

    // If no pending emails, update event status to sent
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
      JSON.stringify({ message: "Emails sent successfully" }),
      { 
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  } catch (error: any) {
    console.error("Error in email sending:", error)
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