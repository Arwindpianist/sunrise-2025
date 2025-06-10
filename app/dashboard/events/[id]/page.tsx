"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { format, isValid } from "date-fns"
import { ArrowLeft, Send, Trash2 } from "lucide-react"

interface Event {
  id: string
  title: string
  description: string
  event_date: string
  location: string
  status: "draft" | "scheduled" | "sent" | "cancelled"
  email_subject: string
  email_template: string
  scheduled_send_time: string
  created_at: string
}

const formatDate = (dateString: string, formatStr: string) => {
  const date = new Date(dateString)
  return isValid(date) ? format(date, formatStr) : "Invalid date"
}

export default function EventDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    fetchEvent()
  }, [params.id])

  const fetchEvent = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("Not authenticated")
      }

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", params.id)
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

  const handleSendEmails = async () => {
    try {
      setIsSending(true)

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("Not authenticated")
      }

      // Get contacts for the event
      const { data: contacts, error: contactsError } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", session.user.id)

      if (contactsError) {
        throw contactsError
      }

      // Create event contacts
      const eventContacts = contacts.map((contact) => ({
        event_id: params.id,
        contact_id: contact.id,
        status: "pending",
      }))

      const { error: eventContactsError } = await supabase
        .from("event_contacts")
        .insert(eventContacts)

      if (eventContactsError) {
        throw eventContactsError
      }

      // Update event status
      const { error: updateError } = await supabase
        .from("events")
        .update({ status: "scheduled" })
        .eq("id", params.id)

      if (updateError) {
        throw updateError
      }

      toast({
        title: "Success!",
        description: "Emails have been scheduled for sending.",
      })

      fetchEvent()
    } catch (error: any) {
      console.error("Error sending emails:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send emails",
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
        .eq("id", params.id)

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

            <div>
              <h3 className="font-medium mb-2">Email Subject</h3>
              <p className="text-muted-foreground">{event.email_subject}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Email Template</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {event.email_template}
              </p>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              {event.status === "draft" && (
                <Button
                  variant="outline"
                  onClick={handleSendEmails}
                  disabled={isSending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSending ? "Scheduling..." : "Send Emails"}
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