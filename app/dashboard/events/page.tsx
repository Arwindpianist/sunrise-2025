"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { format, isValid } from "date-fns"
import { Plus, Send, Trash2, Eye, Calendar, MapPin, Tag, Clock, RotateCcw } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  scheduled_send_time: string
  created_at: string
  category?: string
}

const formatDate = (dateString: string, formatStr: string) => {
  const date = new Date(dateString)
  return isValid(date) ? format(date, formatStr) : "Invalid date"
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    case 'scheduled':
      return 'bg-blue-100 text-blue-800'
    case 'sent':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function EventsPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sendingEmails, setSendingEmails] = useState<string[]>([])
  const [sendingAgain, setSendingAgain] = useState<string[]>([])

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

  const handleSendMessages = async (eventId: string) => {
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

      // Get contacts for the event based on the event's category
      let contactsQuery = supabase
        .from("contacts")
        .select("*")
        .eq("user_id", session.user.id)

      // Filter by category if event has a category (no category means "all")
      if (event.category) {
        contactsQuery = contactsQuery.eq("category", event.category)
      }

      const { data: contacts, error: contactsError } = await contactsQuery

      console.log("Event category:", event.category)
      console.log("Found contacts:", contacts?.length || 0)
      console.log("Contact categories:", contacts?.map(c => c.category))

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

      // Send emails if enabled
      if (event.send_email) {
        const emailResponse = await fetch("/api/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ eventId }),
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
          body: JSON.stringify({ eventId }),
        })

        if (!telegramResponse.ok) {
          const errorData = await telegramResponse.json()
          throw new Error(errorData.error || "Failed to send Telegram messages")
        }
      }

      const messageTypes = []
      if (event.send_email) messageTypes.push("emails")
      if (event.send_telegram) messageTypes.push("Telegram messages")

      toast({
        title: "Success!",
        description: `${messageTypes.join(" and ")} have been sent successfully.`,
      })

      fetchEvents()
    } catch (error: any) {
      console.error("Error sending messages:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send messages",
        variant: "destructive",
      })
    } finally {
      setSendingEmails((prev) => prev.filter((id) => id !== eventId))
    }
  }

  const handleSendAgain = async (eventId: string) => {
    try {
      setSendingAgain((prev) => [...prev, eventId])

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("Not authenticated")
      }

      // Get the original event details
      const { data: originalEvent, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single()

      if (eventError) {
        throw eventError
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

      if (originalEvent.category) {
        countContactsQuery = countContactsQuery.eq("category", originalEvent.category)
      }

      const { count: contactCount } = await countContactsQuery

      // Calculate total cost
      let totalCost = 0
      if (originalEvent.send_email) {
        totalCost += contactCount || 0
      }
      if (originalEvent.send_telegram) {
        // Count contacts with telegram_chat_id
        let telegramContactsQuery = supabase
          .from("contacts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id)
          .not("telegram_chat_id", "is", null)

        if (originalEvent.category) {
          telegramContactsQuery = telegramContactsQuery.eq("category", originalEvent.category)
        }

        const { count: telegramCount } = await telegramContactsQuery
        totalCost += telegramCount || 0
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
          title: originalEvent.title,
          description: originalEvent.description,
          event_date: originalEvent.event_date,
          location: originalEvent.location,
          category: originalEvent.category,
          email_subject: originalEvent.email_subject,
          email_template: originalEvent.email_template,
          telegram_template: originalEvent.telegram_template,
          send_email: originalEvent.send_email,
          send_telegram: originalEvent.send_telegram,
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

      if (originalEvent.category) {
        getContactsQuery = getContactsQuery.eq("category", originalEvent.category)
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
      if (originalEvent.send_email) {
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
      if (originalEvent.send_telegram) {
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
      if (originalEvent.send_email) messageTypes.push("emails")
      if (originalEvent.send_telegram) messageTypes.push("Telegram messages")

      toast({
        title: "Success!",
        description: `Event sent again successfully! ${messageTypes.join(" and ")} have been sent and ${totalCost} credits deducted.`,
      })

      fetchEvents()
    } catch (error: any) {
      console.error("Error sending event again:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send event again",
        variant: "destructive",
      })
    } finally {
      setSendingAgain((prev) => prev.filter((id) => id !== eventId))
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return

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

  const handleCreateEvent = () => {
    router.push("/dashboard/events/create")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Events</h1>
              <p className="text-gray-600 text-sm md:text-base">Manage your events and email campaigns</p>
            </div>
            <Button 
              onClick={handleCreateEvent}
              size="sm"
              className="h-12 md:h-10 w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Create Event</span>
              <span className="md:hidden">Create Event</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <Card className="bg-white/50 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first event</p>
              <Button onClick={handleCreateEvent}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card key={event.id} className="bg-white/50 backdrop-blur-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                        {event.title}
                      </CardTitle>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/events/${event.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {event.status === "draft" && (
                          <DropdownMenuItem 
                            onClick={() => handleSendMessages(event.id)}
                            disabled={sendingEmails.includes(event.id)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {sendingEmails.includes(event.id) ? "Sending..." : "Send Messages"}
                          </DropdownMenuItem>
                        )}
                        {event.status === "sent" && (
                          <DropdownMenuItem 
                            onClick={() => handleSendAgain(event.id)}
                            disabled={sendingAgain.includes(event.id)}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            {sendingAgain.includes(event.id) ? "Sending..." : "Send Again"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-red-600"
                          disabled={sendingEmails.includes(event.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {event.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>Created: {formatDate(event.created_at, "MMM d, yyyy")}</span>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Tag className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="capitalize">{event.category ? event.category : "All Contacts"}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => router.push(`/dashboard/events/${event.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 