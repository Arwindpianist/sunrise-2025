"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { loadStripe } from '@stripe/stripe-js'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { emailTemplates, type EmailTemplateVars } from "@/components/email-templates"
import { format } from "date-fns"

const stripePromise = typeof window !== 'undefined' && window.location.protocol === 'https:' 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  : null

interface Category {
  id: string
  name: string
  color: string
  created_at: string
}

type RecipientCategory = string
type SendOption = "now" | "schedule"

const PRICE_PER_EMAIL = 0.05 // RM 0.05 per email (1 token)

const validateDates = (eventDate: Date, scheduledSendTime: Date) => {
  const now = new Date()
  
  if (eventDate <= now) {
    return "Event date must be in the future"
  }
  
  if (scheduledSendTime <= now) {
    return "Scheduled send time must be in the future"
  }
  
  if (scheduledSendTime >= eventDate) {
    return "Scheduled send time must be before the event date"
  }
  
  return null
}

export default function CreateEventPage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [contactCount, setContactCount] = useState(0)
  const [userBalance, setUserBalance] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    location: "",
    category: "all" as RecipientCategory,
    emailSubject: "",
    emailTemplate: "",
    sendOption: "now" as SendOption,
    scheduledSendTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
  })
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      fetchContactCount()
      fetchUserBalance()
      fetchCategories()
    }
  }, [user, router])

  useEffect(() => {
    if (user) {
      fetchContactCount()
    }
  }, [formData.category, user])

  // Update template when form data changes
  useEffect(() => {
    if (selectedTemplate) {
      const template = emailTemplates.find(t => t.key === selectedTemplate)
      if (template) {
        const templateVars: EmailTemplateVars = {
          firstName: "", // Will be replaced with actual contact name when sending
          eventTitle: formData.title || "Sample Event",
          eventDescription: formData.description || "",
          eventDate: format(formData.eventDate, "EEEE, MMMM do, yyyy 'at' h:mm a"),
          eventLocation: formData.location || "Sample Location",
          hostName: user?.user_metadata?.full_name || "Your Name",
          customMessage: formData.description || "",
        }
        const generatedTemplate = template.template(templateVars)
        setFormData(prev => ({ ...prev, emailTemplate: generatedTemplate }))
      }
    }
  }, [selectedTemplate, formData.title, formData.description, formData.eventDate, formData.location, user])

  const fetchContactCount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      let contactsQuery = supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)

      // Filter by selected category if not "all"
      if (formData.category && formData.category !== "all") {
        contactsQuery = contactsQuery.eq('category', formData.category)
      }

      const { count, error } = await contactsQuery

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

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/contacts/categories")
      if (!response.ok) throw new Error("Failed to fetch categories")
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (contactCount === 0) {
      toast({
        title: "No Contacts",
        description: "Please add some contacts before creating an event.",
        variant: "destructive",
      })
      return
    }

    const totalCost = contactCount * PRICE_PER_EMAIL
    
    if (userBalance < contactCount) {
      setShowPaymentDialog(true)
      return
    }

    if (formData.sendOption === "schedule") {
      const validationError = validateDates(formData.eventDate, formData.scheduledSendTime)
      if (validationError) {
        toast({
          title: "Invalid Dates",
          description: validationError,
          variant: "destructive",
        })
        return
      }
    }

    try {
      setIsLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("No active session")

      const eventData = {
        user_id: session.user.id,
        title: formData.title,
        description: formData.description,
        event_date: formData.eventDate.toISOString(),
        location: formData.location,
        category: formData.category === "all" ? "general" : formData.category,
        email_subject: formData.emailSubject,
        email_template: formData.emailTemplate,
        status: formData.sendOption === "now" ? "draft" : "draft",
        scheduled_send_time: formData.sendOption === "schedule" ? formData.scheduledSendTime.toISOString() : null,
      }

      console.log("Event data being sent:", eventData)
      console.log("Selected category:", formData.category)
      console.log("Category being stored:", eventData.category)
      console.log("Available categories:", categories.map(c => c.name))
      console.log("Category names:", categories.map(c => c.name))

      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single()

      if (eventError) {
        console.error("Event creation error details:", eventError)
        throw eventError
      }

      // Deduct tokens from user balance
      const { error: balanceError } = await supabase
        .from('user_balances')
        .update({ balance: userBalance - contactCount })
        .eq('user_id', session.user.id)

      if (balanceError) throw balanceError

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: session.user.id,
          type: 'usage',
          amount: -contactCount,
          description: `Event: ${formData.title}`,
          status: 'completed',
        })

      if (transactionError) throw transactionError

      toast({
        title: "Success!",
        description: "Event created successfully.",
      })

      router.push('/dashboard/events')
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

  const handleInputChange = useCallback((field: string, value: string | Date) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleTemplateSelect = useCallback((templateKey: string) => {
    setSelectedTemplate(templateKey)
    const template = emailTemplates.find(t => t.key === templateKey)
    if (template) {
      const templateVars: EmailTemplateVars = {
        firstName: "", // Will be replaced with actual contact name when sending
        eventTitle: formData.title || "Sample Event",
        eventDescription: formData.description || "",
        eventDate: format(formData.eventDate, "EEEE, MMMM do, yyyy 'at' h:mm a"),
        eventLocation: formData.location || "Sample Location",
        hostName: user?.user_metadata?.full_name || "Your Name",
        customMessage: formData.description || "",
      }
      const generatedTemplate = template.template(templateVars)
      setFormData(prev => ({ ...prev, emailTemplate: generatedTemplate }))
    }
  }, [formData.title, formData.description, formData.eventDate, formData.location, user])

  const getTemplatePreview = () => {
    const template = emailTemplates.find(t => t.key === selectedTemplate)
    if (!template) return ""
    
    const templateVars: EmailTemplateVars = {
      firstName: "", // Will be replaced with actual contact name when sending
      eventTitle: formData.title || "Sample Event",
      eventDescription: formData.description || "",
      eventDate: format(formData.eventDate, "EEEE, MMMM do, yyyy 'at' h:mm a"),
      eventLocation: formData.location || "Sample Location",
      hostName: user?.user_metadata?.full_name || "Your Name",
      customMessage: formData.description || "",
    }
    return template.template(templateVars)
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
      if (!stripe) {
        toast({
          title: "Payment Error",
          description: "Stripe is not available in development mode. Please use HTTPS in production.",
          variant: "destructive",
        })
        return
      }

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-4 py-6">
        <Card className="bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">Create New Event</CardTitle>
            <p className="text-gray-600 text-sm md:text-base">Set up your event and email campaign</p>
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
                  <option value="all">All Contacts</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
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

              <div className="space-y-4">
                <Label>Email Template</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {emailTemplates.map((template) => (
                    <button
                      key={template.key}
                      type="button"
                      onClick={() => handleTemplateSelect(template.key)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        selectedTemplate === template.key
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-medium text-sm">{template.label}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {template.key === "birthday" && "🎉"}
                        {template.key === "openHouse" && "🏡"}
                        {template.key === "wedding" && "💍"}
                        {template.key === "meeting" && "📅"}
                        {template.key === "babyShower" && "👶"}
                        {template.key === "generic" && "📧"}
                      </div>
                    </button>
                  ))}
                </div>
                
                {selectedTemplate && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTemplatePreview(true)}
                    >
                      Preview Template
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate("")
                        setFormData(prev => ({ ...prev, emailTemplate: "" }))
                      }}
                    >
                      Clear Template
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailTemplate">Email Template HTML</Label>
                <Textarea
                  id="emailTemplate"
                  value={formData.emailTemplate}
                  onChange={(e) => handleInputChange("emailTemplate", e.target.value)}
                  placeholder="Select a template above or enter custom HTML"
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  You can customize the template HTML above. Use {'{{firstName}}'}, {'{{eventTitle}}'}, {'{{eventDate}}'}, {'{{eventLocation}}'} as placeholders.
                </p>
              </div>

              <div className="space-y-4">
                <Label>Send Options</Label>
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="send-now"
                      name="sendOption"
                      value="now"
                      checked={formData.sendOption === "now"}
                      onChange={(e) => handleInputChange("sendOption", e.target.value as SendOption)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="send-now" className="text-sm">Send Now</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="schedule"
                      name="sendOption"
                      value="schedule"
                      checked={formData.sendOption === "schedule"}
                      onChange={(e) => handleInputChange("sendOption", e.target.value as SendOption)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="schedule" className="text-sm">Schedule Send</Label>
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
                    <p className="font-medium text-sm md:text-base">Current Balance</p>
                    <p className="text-sm text-muted-foreground">{userBalance} tokens</p>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-orange-500">
                    RM{(userBalance * PRICE_PER_EMAIL).toFixed(2)}
                  </p>
                </div>

                <div className="flex justify-between items-center p-4 bg-white/50 rounded-lg backdrop-blur-sm">
                  <div>
                    <p className="font-medium text-sm md:text-base">Event Cost</p>
                    <p className="text-sm text-muted-foreground">{contactCount} emails × RM{PRICE_PER_EMAIL.toFixed(2)}</p>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-orange-500">
                    RM{totalCost.toFixed(2)}
                  </p>
                </div>

                {userBalance < contactCount && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-medium text-sm md:text-base">Insufficient Balance</p>
                    <p className="text-red-600 text-sm">
                      You need {contactCount - userBalance} more tokens to create this event.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/events')}
                  className="flex-1 h-12 md:h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || contactCount === 0}
                  className="flex-1 h-12 md:h-10 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                >
                  {isLoading ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Purchase Additional Tokens</DialogTitle>
            <DialogDescription>
              Purchase additional tokens to create this event. You need {contactCount} tokens to send emails to all contacts in the selected category.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4 text-center">
              <p className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                RM {totalCost.toFixed(2)}
              </p>
              <p className="text-muted-foreground">{contactCount} tokens needed</p>
            </div>
            <div className="space-y-4">
              <Button 
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full h-12 md:h-10 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
              >
                {isLoading ? "Processing..." : "Purchase Tokens"}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
                className="w-full h-12 md:h-10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
        <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Email Template Preview</DialogTitle>
            <DialogDescription>
              Preview how your email will look when sent to recipients.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div 
              className="border rounded-lg p-4 max-h-96 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: getTemplatePreview() }}
            />
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline"
                onClick={() => setShowTemplatePreview(false)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 