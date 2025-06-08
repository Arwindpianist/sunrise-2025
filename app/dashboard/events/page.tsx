"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { Plus, Send, Trash2 } from "lucide-react"

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

export default function EventsPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sendingEmails, setSendingEmails] = useState<string[]>([])

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("Not authenticated")
      }

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setEvents(data || [])
    } catch (error: any) {
      console.error("Error fetching events:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch events",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendEmails = async (eventId: string) => {
    try {
      setSendingEmails((prev) => [...prev, eventId])

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("Not authenticated")
      }

      // Get event details
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single()

      if (eventError) {
        throw eventError
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
        event_id: eventId,
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
        .eq("id", eventId)

      if (updateError) {
        throw updateError
      }

      toast({
        title: "Success!",
        description: "Emails have been scheduled for sending.",
      })

      fetchEvents()
    } catch (error: any) {
      console.error("Error sending emails:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send emails",
        variant: "destructive",
      })
    } finally {
      setSendingEmails((prev) => prev.filter((id) => id !== eventId))
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId)

      if (error) {
        throw error
      }

      toast({
        title: "Success!",
        description: "Event has been deleted.",
      })

      fetchEvents()
    } catch (error: any) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Events</h1>
        <Button onClick={() => router.push("/dashboard/events/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">No events found</p>
            <Button onClick={() => router.push("/dashboard/events/create")}>
              Create your first event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{event.title}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {event.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>
                  <div className="text-sm">
                    <p>
                      <strong>Date:</strong>{" "}
                      {format(new Date(event.event_date), "PPP")}
                    </p>
                    <p>
                      <strong>Location:</strong> {event.location}
                    </p>
                    <p>
                      <strong>Send Time:</strong>{" "}
                      {format(new Date(event.scheduled_send_time), "PPP p")}
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    {event.status === "draft" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendEmails(event.id)}
                        disabled={sendingEmails.includes(event.id)}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {sendingEmails.includes(event.id)
                          ? "Scheduling..."
                          : "Send Emails"}
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteEvent(event.id)}
                      disabled={sendingEmails.includes(event.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 