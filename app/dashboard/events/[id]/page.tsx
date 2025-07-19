"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { format, isValid } from "date-fns"
import { ArrowLeft, Send, Trash2 } from "lucide-react"
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
  send_email: boolean
  send_telegram: boolean
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

      // Debug log to see raw date values
      console.log("Raw event dates:", {
        event_date: data.event_date,
        scheduled_send_time: data.scheduled_send_time,
        created_at: data.created_at
      })

      setEvent(data)
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
      if (event && event.category) {
        contactsQuery = contactsQuery.eq("category", event.category)
      }

      const { data: contacts, error: contactsError } = await contactsQuery

      console.log("Event category:", event?.category)
      console.log("Found contacts:", contacts?.length || 0)
      console.log("Contact categories:", contacts?.map(c => c.category))

      if (contactsError) {
        throw contactsError
      }

      // Create event contacts
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

      const messageTypes = []
      if (event?.send_email) messageTypes.push("emails")
      if (event?.send_telegram) messageTypes.push("Telegram messages")

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
              <Button
                variant="destructive"
                onClick={handleDeleteEvent}
                disabled={isSending}
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