"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { format, isValid } from "date-fns"
import { Plus, Send, Trash2, Eye, Calendar, MapPin, Tag, Clock, RotateCcw, Users } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { dispatchEventChannels } from "@/lib/event-dispatch"

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
  scheduled_send_time: string
  created_at: string
  category?: string
  contact_count?: number
}

const formatDate = (dateString: string, formatStr: string) => {
  const date = new Date(dateString)
  return isValid(date) ? format(date, formatStr) : "Invalid date"
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "bg-muted text-foreground"
    case "scheduled":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-300"
    case "sent":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
    case "cancelled":
      return "bg-destructive/15 text-destructive"
    default:
      return "bg-muted text-foreground"
  }
}

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sendingEmails, setSendingEmails] = useState<string[]>([])
  const [sendingAgain, setSendingAgain] = useState<string[]>([])

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events", { credentials: "include" })
      if (res.status === 401) {
        router.push("/login")
        return
      }
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload?.error || "Failed to fetch events")
      }
      const data = await res.json()
      setEvents(Array.isArray(data) ? data : [])
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

  const dispatchEventSend = async (eventId: string) => {
    const evRes = await fetch(`/api/events/${eventId}`, { credentials: "include" })
    if (evRes.status === 401) {
      router.push("/login")
      throw new Error("Unauthorized")
    }
    if (!evRes.ok) {
      const payload = await evRes.json().catch(() => ({}))
      throw new Error(payload?.error || "Could not load event")
    }
    const event = await evRes.json()

    const prep = await fetch(`/api/events/${eventId}/prepare-dispatch`, {
      method: "POST",
      credentials: "include",
    })
    if (!prep.ok) {
      const payload = await prep.json().catch(() => ({}))
      throw new Error(payload?.error || "Could not prepare contacts for this event")
    }

    await dispatchEventChannels(eventId, {
      sendEmail: !!event.send_email,
      sendTelegram: !!event.send_telegram,
      sendDiscord: !!event.send_discord,
      sendSlack: !!event.send_slack,
    })
  }

  const handleSendMessages = async (eventId: string) => {
    try {
      setSendingEmails((prev) => [...prev, eventId])
      await dispatchEventSend(eventId)

      toast({
        title: "Success!",
        description: "Your messages are being sent.",
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
      await dispatchEventSend(eventId)

      toast({
        title: "Success!",
        description: "Another send has been queued with a fresh audience list.",
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
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (res.status === 401) {
        router.push("/login")
        return
      }
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload?.error || "Failed to delete")
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
    <div className="min-h-screen bg-gradient-to-b from-background via-card/20 to-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">Events</h1>
              <p className="text-sm text-muted-foreground md:text-base">Manage your events and email campaigns</p>
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
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <Card className="border border-border/80 bg-card">
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium text-foreground">No events found</h3>
              <p className="mb-4 text-muted-foreground">Get started by creating your first event</p>
              <Button onClick={handleCreateEvent}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card key={event.id} className="border border-border/80 bg-card transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate text-lg font-semibold text-foreground">
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
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>Created: {formatDate(event.created_at, "MMM d, yyyy")}</span>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Tag className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="capitalize">{event.category ? event.category : "All Contacts"}</span>
                      </div>
                      
                      {/* Communication Methods */}
                      <div className="flex gap-1">
                        {event.send_email && (
                          <span className="inline-flex items-center rounded bg-sky-500/15 px-1.5 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">
                            📧
                          </span>
                        )}
                        {event.send_telegram && (
                          <span className="inline-flex items-center rounded bg-emerald-500/15 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                            📱
                          </span>
                        )}
                        {event.send_discord && (
                          <span className="inline-flex items-center rounded bg-violet-500/15 px-1.5 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                            🎮
                          </span>
                        )}
                        {event.send_slack && (
                          <span className="inline-flex items-center rounded bg-primary/15 px-1.5 py-0.5 text-xs font-medium text-primary">
                            💬
                          </span>
                        )}
                      </div>
                      
                      {event.status === "draft" && (
                        <div className="flex items-center text-sm text-primary">
                          <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>
                            {event.send_discord && !event.send_slack
                              ? "Ready to send 1 Discord message" 
                              : event.send_slack && !event.send_discord
                              ? "Ready to send 1 Slack message"
                              : event.send_discord && event.send_slack
                              ? "Ready to send 1 Discord message and 1 Slack message"
                              : `Ready to send to ${event.contact_count || 0} contacts`
                            }
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border pt-3">
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