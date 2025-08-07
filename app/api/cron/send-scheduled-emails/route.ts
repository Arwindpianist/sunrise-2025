import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get scheduled events that are ready to be sent
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_send_time", new Date().toISOString())

    if (eventsError) {
      console.error("Error fetching scheduled events:", eventsError)
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch scheduled events" }),
        { 
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    }

    // Send messages for each event
    for (const event of events) {
      try {
        // Send emails if enabled
        if (event.send_email) {
          const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ eventId: event.id }),
          })

          if (!emailResponse.ok) {
            console.error(`Failed to send emails for event ${event.id}`)
          }
        }

        // Send Telegram messages if enabled
        if (event.send_telegram) {
          const telegramResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ eventId: event.id }),
          })

          if (!telegramResponse.ok) {
            console.error(`Failed to send Telegram messages for event ${event.id}`)
          }
        }

        // Send Discord message if enabled
        if (event.send_discord) {
          const discordResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/discord/send-event`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ eventId: event.id }),
          })

          if (!discordResponse.ok) {
            console.error(`Failed to send Discord message for event ${event.id}`)
          }
        }

        // Send Slack message if enabled
        if (event.send_slack) {
          const slackResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/slack/send-event`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ eventId: event.id }),
          })

          if (!slackResponse.ok) {
            console.error(`Failed to send Slack message for event ${event.id}`)
          }
        }
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error)
      }
    }

    return new NextResponse(
      JSON.stringify({ message: "Scheduled messages processed" }),
      { 
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  } catch (error: any) {
    console.error("Error in cron job:", error)
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