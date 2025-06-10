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
import { loadStripe } from '@stripe/stripe-js'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { isValid } from "date-fns"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const RECIPIENT_CATEGORIES = [
  { id: "all", label: "All Contacts" },
  { id: "family", label: "Family" },
  { id: "friend", label: "Friend" },
  { id: "guest", label: "Guest" },
  { id: "other", label: "Other" },
] as const

type RecipientCategory = typeof RECIPIENT_CATEGORIES[number]["id"]
type SendOption = "now" | "schedule"

const PRICE_PER_EMAIL = 0.05 // RM 0.05 per email (1 token)

const validateDates = (eventDate: Date, scheduledSendTime: Date) => {
  if (!isValid(eventDate)) {
    throw new Error("Invalid event date")
  }
  if (!isValid(scheduledSendTime)) {
    throw new Error("Invalid scheduled send time")
  }
  if (scheduledSendTime < new Date()) {
    throw new Error("Scheduled send time must be in the future")
  }
  if (eventDate < new Date()) {
    throw new Error("Event date must be in the future")
  }
}

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
    category: "other" as RecipientCategory,
    sendOption: "schedule" as SendOption,
  })
  const [contactCount, setContactCount] = useState(0)
  const [userBalance, setUserBalance] = useState(0)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  useEffect(() => {
    if (user) {
      fetchContactCount()
      fetchUserBalance()
    }
  }, [user, formData.category])

  const fetchContactCount = async () => {
    try {
      let query = supabase
        .from('contacts')
        .select('id', { count: 'exact' })
        .eq('user_id', user?.id)

      if (formData.category !== 'all') {
        query = query.eq('category', formData.category)
      }

      const { count, error } = await query

      if (error) throw error
      setContactCount(count || 0)
    } catch (error) {
      console.error('Error fetching contact count:', error)
    }
  }

  const fetchUserBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setUserBalance(data?.balance || 0)
    } catch (error) {
      console.error('Error fetching user balance:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!user) {
        throw new Error("Not authenticated")
      }

      // Validate dates
      validateDates(formData.eventDate, formData.scheduledSendTime)

      // Check if user has enough balance
      if (formData.sendOption === "now" && userBalance < contactCount) {
        setShowPaymentDialog(true)
        setIsLoading(false)
        return
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
          category: formData.category,
          status: formData.sendOption === "now" ? "sending" : "scheduled",
        })
        .select()
        .single()

      if (eventError) {
        throw eventError
      }

      // If send now is selected, trigger the email sending process
      if (formData.sendOption === "now") {
        // Get the session to access the JWT token
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          throw new Error("No active session")
        }

        const { error: sendError } = await supabase.functions.invoke('send-event-emails', {
          body: {
            eventId: event.id,
            category: formData.category,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        })

        if (sendError) {
          throw sendError
        }

        // Deduct credits from user balance
        const { error: balanceError } = await supabase
          .from('user_balances')
          .upsert(
            {
              user_id: user.id,
              balance: userBalance - contactCount,
            },
            {
              onConflict: 'user_id',
              ignoreDuplicates: false
            }
          )

        if (balanceError) {
          throw balanceError
        }

        // Create transaction record
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            type: 'usage',
            amount: -contactCount,
            description: `Send ${contactCount} event emails for "${formData.title}"`,
            status: 'completed',
          })

        if (transactionError) {
          throw transactionError
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

  const handlePayment = async () => {
    try {
      setIsLoading(true)

      // Create payment intent
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("No active session")

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: contactCount,
          type: 'event',
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (error) throw error

      // Load Stripe
      const stripe = await stripePromise
      if (!stripe) throw new Error("Stripe failed to load")

      // Confirm payment
      const { error: stripeError } = await stripe.confirmPayment({
        elements: undefined,
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/events/create?success=true`,
        },
      })

      if (stripeError) throw stripeError

    } catch (error: any) {
      console.error("Payment error:", error)
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setShowPaymentDialog(false)
    }
  }

  if (!user || !mounted) {
    return null
  }

  const totalCost = contactCount * PRICE_PER_EMAIL

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
              <Label htmlFor="category">Recipient Category</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value as RecipientCategory)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                {RECIPIENT_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground">
                {contactCount} contacts in this category
              </p>
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

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-white/50 rounded-lg backdrop-blur-sm">
                <div>
                  <p className="font-medium">Current Balance</p>
                  <p className="text-sm text-muted-foreground">{userBalance} tokens</p>
                </div>
                <p className="text-2xl font-bold text-orange-500">
                  RM{(userBalance * PRICE_PER_EMAIL).toFixed(2)}
                </p>
              </div>

              <div className="flex justify-between items-center p-4 bg-white/50 rounded-lg backdrop-blur-sm">
                <div>
                  <p className="font-medium">Total Cost</p>
                  <p className="text-sm text-muted-foreground">{contactCount} tokens</p>
                </div>
                <p className="text-2xl font-bold text-orange-500">
                  RM{totalCost.toFixed(2)}
                </p>
              </div>
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

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insufficient Balance</DialogTitle>
            <DialogDescription>
              You need RM{totalCost.toFixed(2)} ({contactCount} tokens) to send {contactCount} emails. Your current balance is RM{(userBalance * PRICE_PER_EMAIL).toFixed(2)} ({userBalance} tokens).
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Add Tokens"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 