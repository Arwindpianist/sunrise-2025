"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { format, isValid } from "date-fns"
import { ArrowLeft, Send, Trash2, RotateCcw } from "lucide-react"
import EmailTemplatePreview from "@/components/email-template-preview"

interface Event {
  id: string
  title: string
  description: string
  event_date: string
  location: string
  status: "draft" | "scheduled" | "sent" | "cancelled"
  email_subject: string
  email_template: string
  telegram_template: string | null
  discord_template: string | null
  slack_template: string | null
  send_email: boolean
  send_telegram: boolean
  send_discord: boolean
  send_slack: boolean
  scheduled_send_time: string | null
  created_at: string
  category?: string
}

const formatDate = (dateString: string | null, formatStr: string) => {
  if (!dateString) return "Not scheduled"
  const date = new Date(dateString)
  return isValid(date) ? format(date, formatStr) : "Invalid date"
}

export default function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { supabase } = useSupabase()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isSendingAgain, setIsSendingAgain] = useState(false)

  useEffect(() => {
    fetchEvent()
  }, [id])

  const fetchEvent = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("Not authenticated")
      }

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .eq("user_id", session.user.id)
        .single()

      if (error) {
        throw error
      }

      // Check for transactions and logs to determine actual status
      let actualStatus = data.status

      // Check if there are any transactions for this event
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id)
        .ilike("description", `%${data.title}%`)
        .order("created_at", { ascending: false })
        .limit(1)

      // Check for Discord logs if Discord is enabled
      if (data.send_discord) {
        const { data: discordLogs } = await supabase
          .from("discord_logs")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(1)

        if (discordLogs && discordLogs.length > 0) {
          const latestDiscordLog = discordLogs[0]
          // Check if the log message contains the event title
          if (latestDiscordLog.message_content.includes(data.title)) {
            actualStatus = "sent"
          }
        }
      }

      // Check for Slack logs if Slack is enabled
      if (data.send_slack) {
        const { data: slackLogs } = await supabase
          .from("slack_logs")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(1)

        if (slackLogs && slackLogs.length > 0) {
          const latestSlackLog = slackLogs[0]
          // Check if the log message contains the event title
          if (latestSlackLog.message_content.includes(data.title)) {
            actualStatus = "sent"
          }
        }
      }

      // If there are transactions, the event was sent
      if (transactions && transactions.length > 0) {
        actualStatus = "sent"
      }

      // Update the event data with the actual status
      const eventData = { ...data, status: actualStatus }

      // Debug log to see raw date values
      console.log("Raw event dates:", {
        event_date: eventData.event_date,
        scheduled_send_time: eventData.scheduled_send_time,
        created_at: eventData.created_at
      })

      setEvent(eventData)
    } catch (error: any) {
      console.error("Error fetching event:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch event",
        variant: "destructive",
      })
      router.push("/dashboard/events")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessages = async () => {
    try {
      setIsSending(true)

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("Not authenticated")
      }

      // Get contacts for the event based on the event's category
      let contactsQuery = supabase
        .from("contacts")
        .select("*")
        .eq("user_id", session.user.id)

      // Filter by category if event has a category (no category means "all")
      // Note: "general" category means "all contacts", so don't filter
      if (event && event.category && event.category !== "general") {
        contactsQuery = contactsQuery.eq("category", event.category)
      }

      const { data: contacts, error: contactsError } = await contactsQuery

      console.log("Event category:", event?.category)
      console.log("Found contacts:", contacts?.length || 0)
      console.log("Contact categories:", contacts?.map(c => c.category))

      if (contactsError) {
        throw contactsError
      }

      // Check if event contacts already exist
      const { data: existingEventContacts, error: existingError } = await supabase
        .from("event_contacts")
        .select("contact_id")
        .eq("event_id", id)

      if (existingError) {
        throw existingError
      }

      // Only create event contacts if they don't already exist
      if (!existingEventContacts || existingEventContacts.length === 0) {
        const eventContacts = contacts.map((contact) => ({
          event_id: id,
          contact_id: contact.id,
          status: "pending",
        }))

        const { error: eventContactsError } = await supabase
          .from("event_contacts")
          .insert(eventContacts)

        if (eventContactsError) {
          throw eventContactsError
        }
      } else {
        console.log(`Event contacts already exist for event ${id}`)
      }

      // Send emails if enabled
      if (event?.send_email) {
        const emailResponse = await fetch("/api/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ eventId: id }),
        })

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json()
          throw new Error(errorData.error || "Failed to send emails")
        }
      }

      // Send Telegram messages if enabled
      if (event?.send_telegram) {
        const telegramResponse = await fetch("/api/telegram/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ eventId: id }),
        })

        if (!telegramResponse.ok) {
          const errorData = await telegramResponse.json()
          throw new Error(errorData.error || "Failed to send Telegram messages")
        }
      }

      // Send Discord message if enabled
      if (event?.send_discord) {
        const discordResponse = await fetch("/api/discord/send-event", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ eventId: id }),
        })

        if (!discordResponse.ok) {
          const errorData = await discordResponse.json()
          throw new Error(errorData.error || "Failed to send Discord message")
        }
      }

      // Send Slack message if enabled
      if (event?.send_slack) {
        const slackResponse = await fetch("/api/slack/send-event", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ eventId: id }),
        })

        if (!slackResponse.ok) {
          const errorData = await slackResponse.json()
          throw new Error(errorData.error || "Failed to send Slack message")
        }
      }

      const messageTypes = []
      if (event?.send_email) messageTypes.push("emails")
      if (event?.send_telegram) messageTypes.push("Telegram messages")
      if (event?.send_discord) messageTypes.push("Discord message")
      if (event?.send_slack) messageTypes.push("Slack message")

      toast({
        title: "Success!",
        description: `${messageTypes.join(" and ")} have been sent successfully.`,
      })

      fetchEvent()
    } catch (error: any) {
      console.error("Error sending messages:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send messages",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleSendAgain = async () => {
    try {
      setIsSendingAgain(true)

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("Not authenticated")
      }

      if (!event) {
        throw new Error("Event not found")
      }

      // Check user balance
      const { data: balanceData, error: balanceError } = await supabase
        .from("user_balances")
        .select("balance")
        .eq("user_id", session.user.id)
        .single()

      if (balanceError && balanceError.code !== 'PGRST116') {
        throw balanceError
      }

      const currentBalance = balanceData?.balance || 0

      // Count contacts for this event
      let countContactsQuery = supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id)

      if (event?.category) {
        countContactsQuery = countContactsQuery.eq("category", event.category)
      }

      const { count: contactCount } = await countContactsQuery

      // Calculate total cost
      let totalCost = 0
      if (event?.send_email) {
        totalCost += contactCount || 0
      }
      if (event?.send_telegram) {
        // Count contacts with telegram_chat_id
        let telegramContactsQuery = supabase
          .from("contacts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id)
          .not("telegram_chat_id", "is", null)

        // Note: "general" category means "all contacts", so don't filter
        if (event.category && event.category !== "general") {
          telegramContactsQuery = telegramContactsQuery.eq("category", event.category)
        }

        const { count: telegramCount } = await telegramContactsQuery
        totalCost += telegramCount || 0
      }
      if (event?.send_discord) {
        // Discord costs only 1 token regardless of contact count
        totalCost += 1
      }
      if (event?.send_slack) {
        // Slack costs only 1 token regardless of contact count
        totalCost += 1
      }

      // Check if user has enough balance
      if (currentBalance < totalCost) {
        toast({
          title: "Insufficient Balance",
          description: `You need ${totalCost} credits to send this event again. Current balance: ${currentBalance} credits.`,
          variant: "destructive",
        })
        return
      }

      // Create a new event with the same details but new ID
      const { data: newEvent, error: createError } = await supabase
        .from("events")
        .insert({
          user_id: session.user.id,
          title: event.title,
          description: event.description,
          event_date: event.event_date,
          location: event.location,
          category: event.category,
          email_subject: event.email_subject,
          email_template: event.email_template,
          telegram_template: event.telegram_template,
          discord_template: event.discord_template,
          slack_template: event.slack_template,
          send_email: event.send_email,
          send_telegram: event.send_telegram,
          send_discord: event.send_discord,
          send_slack: event.send_slack,
          status: "draft",
          scheduled_send_time: null,
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      // Get contacts for the new event
      let getContactsQuery = supabase
        .from("contacts")
        .select("*")
        .eq("user_id", session.user.id)

      // Note: "general" category means "all contacts", so don't filter
      if (event.category && event.category !== "general") {
        getContactsQuery = getContactsQuery.eq("category", event.category)
      }

      const { data: contacts, error: contactsError } = await getContactsQuery

      if (contactsError) {
        throw contactsError
      }

      // Create event contacts for the new event
      const eventContacts = contacts.map((contact) => ({
        event_id: newEvent.id,
        contact_id: contact.id,
        status: "pending",
      }))

      const { error: eventContactsError } = await supabase
        .from("event_contacts")
        .insert(eventContacts)

      if (eventContactsError) {
        throw eventContactsError
      }

      // Send emails if enabled
      if (event.send_email) {
        const emailResponse = await fetch("/api/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ eventId: newEvent.id }),
        })

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json()
          throw new Error(errorData.error || "Failed to send emails")
        }
      }

      // Send Telegram messages if enabled
      if (event.send_telegram) {
        const telegramResponse = await fetch("/api/telegram/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ eventId: newEvent.id }),
        })

        if (!telegramResponse.ok) {
          const errorData = await telegramResponse.json()
          throw new Error(errorData.error || "Failed to send Telegram messages")
        }
      }

      // Deduct credits from user balance
      if (totalCost > 0) {
        const { error: balanceUpdateError } = await supabase
          .from("user_balances")
          .update({ balance: currentBalance - totalCost })
          .eq("user_id", session.user.id)

        if (balanceUpdateError) {
          throw balanceUpdateError
        }
      }

      const messageTypes = []
      if (event.send_email) messageTypes.push("emails")
      if (event.send_telegram) messageTypes.push("Telegram messages")

      toast({
        title: "Success!",
        description: `Event sent again successfully! ${messageTypes.join(" and ")} have been sent and ${totalCost} credits deducted.`,
      })

      router.push("/dashboard/events")
    } catch (error: any) {
      console.error("Error sending event again:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send event again",
        variant: "destructive",
      })
    } finally {
      setIsSendingAgain(false)
    }
  }

  const handleDeleteEvent = async () => {
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id)

      if (error) {
        throw error
      }

      toast({
        title: "Success!",
        description: "Event has been deleted.",
      })

      router.push("/dashboard/events")
    } catch (error: any) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!event) {
    return <div>Event not found</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center space-x-4 mb-8">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{event.title}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-start">
            <span>Event Details</span>
            <span className="text-sm font-normal text-muted-foreground">
              {event.status}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-muted-foreground">{event.description}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-2">Event Date</h3>
                <p className="text-muted-foreground">
                  {formatDate(event.event_date, "PPP p")}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Location</h3>
                <p className="text-muted-foreground">{event.location}</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Scheduled Send Time</h3>
                <p className="text-muted-foreground">
                  {formatDate(event.scheduled_send_time, "PPP p")}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Created At</h3>
                <p className="text-muted-foreground">
                  {formatDate(event.created_at, "PPP p")}
                </p>
              </div>
            </div>

            {/* Communication Methods */}
            <div>
              <h3 className="font-medium mb-2">Communication Methods</h3>
              <div className="flex gap-2">
                {event.send_email && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    📧 Email
                  </span>
                )}
                {event.send_telegram && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    📱 Telegram
                  </span>
                )}
                {event.send_discord && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    🎮 Discord
                  </span>
                )}
                {event.send_slack && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    💬 Slack
                  </span>
                )}
              </div>
            </div>

            {/* Email Section - Only show if email is enabled */}
            {event.send_email && (
              <>
                <div>
                  <h3 className="font-medium mb-2">Email Subject</h3>
                  <p className="text-muted-foreground">{event.email_subject}</p>
                </div>

                <div>
                  <EmailTemplatePreview 
                    htmlContent={event.email_template}
                    subject={event.email_subject}
                    title="Email Template"
                  />
                </div>
              </>
            )}

            {/* Telegram Section - Only show if Telegram is enabled */}
            {event.send_telegram && (
              <div>
                <h3 className="font-medium mb-2">Telegram Template</h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <pre className="whitespace-pre-wrap text-sm font-mono">{event.telegram_template || "No template set"}</pre>
                </div>
              </div>
            )}

            {/* Discord Section - Only show if Discord is enabled */}
            {event.send_discord && (
              <div>
                <h3 className="font-medium mb-2">Discord Template</h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <pre className="whitespace-pre-wrap text-sm font-mono">{event.discord_template || "No template set"}</pre>
                </div>
              </div>
            )}

            {/* Slack Section - Only show if Slack is enabled */}
            {event.send_slack && (
              <div>
                <h3 className="font-medium mb-2">Slack Template</h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <pre className="whitespace-pre-wrap text-sm font-mono">{event.slack_template || "No template set"}</pre>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4">
              {event.status === "draft" && (
                <Button
                  variant="outline"
                  onClick={handleSendMessages}
                  disabled={isSending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSending ? "Sending..." : "Send Messages"}
                </Button>
              )}
              {event.status === "sent" && (
                <Button
                  variant="outline"
                  onClick={handleSendAgain}
                  disabled={isSendingAgain}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {isSendingAgain ? "Sending..." : "Send Again"}
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={handleDeleteEvent}
                disabled={isSending || isSendingAgain}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Event
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 