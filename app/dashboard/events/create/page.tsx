"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { DateTimePicker } from "@/components/ui/date-time-picker"

const RECIPIENT_CATEGORIES = [
  { id: "all", label: "All Recipients" },
  { id: "active", label: "Active Recipients" },
  { id: "inactive", label: "Inactive Recipients" },
  { id: "new", label: "New Recipients" },
  { id: "returning", label: "Returning Recipients" },
] as const

type RecipientCategory = typeof RECIPIENT_CATEGORIES[number]["id"]
type SendOption = "now" | "schedule"

export default function CreateEventPage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventDate: new Date(),
    location: "",
    emailSubject: "",
    emailTemplate: "",
    scheduledSendTime: new Date(),
    recipientCategory: "all" as RecipientCategory,
    sendOption: "schedule" as SendOption,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!user) {
        throw new Error("Not authenticated")
      }

      // Create the event
      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          event_date: formData.eventDate.toISOString(),
          location: formData.location,
          email_subject: formData.emailSubject,
          email_template: formData.emailTemplate,
          scheduled_send_time: formData.scheduledSendTime.toISOString(),
          recipient_category: formData.recipientCategory,
          status: formData.sendOption === "now" ? "sending" : "scheduled",
        })
        .select()
        .single()

      if (eventError) {
        throw eventError
      }

      // If send now is selected, trigger the email sending process
      if (formData.sendOption === "now") {
        const { error: sendError } = await supabase.functions.invoke('send-event-emails', {
          body: {
            eventId: event.id,
            recipientCategory: formData.recipientCategory,
          }
        })

        if (sendError) {
          throw sendError
        }
      }

      toast({
        title: "Success!",
        description: formData.sendOption === "now" 
          ? "Your event has been created and emails are being sent."
          : "Your event has been created and scheduled.",
      })

      router.push("/dashboard/events")
    } catch (error: any) {
      console.error("Error creating event:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | Date) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (!user || !mounted) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Event</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
                placeholder="Enter event title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter event description"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Event Date & Time</Label>
              <DateTimePicker
                date={formData.eventDate}
                onSelect={(date) => handleInputChange("eventDate", date)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="Enter event location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientCategory">Recipient Category</Label>
              <select
                id="recipientCategory"
                value={formData.recipientCategory}
                onChange={(e) => handleInputChange("recipientCategory", e.target.value as RecipientCategory)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                {RECIPIENT_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailSubject">Email Subject</Label>
              <Input
                id="emailSubject"
                value={formData.emailSubject}
                onChange={(e) => handleInputChange("emailSubject", e.target.value)}
                placeholder="Enter email subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailTemplate">Email Template</Label>
              <Textarea
                id="emailTemplate"
                value={formData.emailTemplate}
                onChange={(e) => handleInputChange("emailTemplate", e.target.value)}
                placeholder="Enter email template"
                rows={6}
              />
            </div>

            <div className="space-y-4">
              <Label>Send Options</Label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="send-now"
                    name="sendOption"
                    value="now"
                    checked={formData.sendOption === "now"}
                    onChange={(e) => handleInputChange("sendOption", e.target.value as SendOption)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="send-now">Send Now</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="schedule"
                    name="sendOption"
                    value="schedule"
                    checked={formData.sendOption === "schedule"}
                    onChange={(e) => handleInputChange("sendOption", e.target.value as SendOption)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="schedule">Schedule Send</Label>
                </div>
              </div>

              {formData.sendOption === "schedule" && (
                <div className="space-y-2">
                  <Label>Schedule Send Time</Label>
                  <DateTimePicker
                    date={formData.scheduledSendTime}
                    onSelect={(date) => handleInputChange("scheduledSendTime", date)}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading 
                  ? (formData.sendOption === "now" ? "Sending..." : "Creating...") 
                  : (formData.sendOption === "now" ? "Create & Send Now" : "Create Event")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 