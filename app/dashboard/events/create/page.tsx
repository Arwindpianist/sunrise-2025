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
import { telegramTemplates, type TelegramTemplateVars } from "@/components/telegram-templates"
import { format } from "date-fns"
import { Mail, Send, MessageCircle, Smartphone, Zap, ArrowRight, AlertTriangle } from "lucide-react"
import { canCreateEvent, getLimitInfo, getLimitUpgradeRecommendation } from "@/lib/subscription-limits"

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

interface CommunicationMethod {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  available: boolean
  comingSoon?: boolean
}

const PRICE_PER_EMAIL = 0.05 // RM 0.05 per email (1 token)

const communicationMethods: CommunicationMethod[] = [
  {
    id: "email",
    name: "Email",
    icon: <Mail className="h-6 w-6" />,
    description: "Professional email invitations with rich formatting",
    available: true,
  },
  {
    id: "telegram",
    name: "Telegram",
    icon: <Send className="h-6 w-6" />,
    description: "Instant messaging for quick delivery",
    available: true,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: <MessageCircle className="h-6 w-6" />,
    description: "Direct WhatsApp Business messages",
    available: false,
    comingSoon: true,
  },
  {
    id: "sms",
    name: "SMS",
    icon: <Smartphone className="h-6 w-6" />,
    description: "Traditional text messages",
    available: false,
    comingSoon: true,
  },
]

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
  const [showOnboardingModal, setShowOnboardingModal] = useState(true)
  const [contactCount, setContactCount] = useState(0)
  const [userBalance, setUserBalance] = useState(0)
  const [eventLimitCheck, setEventLimitCheck] = useState<{ allowed: boolean; currentCount: number; maxAllowed: number; tier: string } | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedMethods, setSelectedMethods] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    location: "",
    category: "all" as RecipientCategory,
    emailSubject: "",
    emailTemplate: "",
    telegramTemplate: "",
    sendEmail: true,
    sendTelegram: false,
    sendOption: "now" as SendOption,
    scheduledSendTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
  })
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<string>("")
  const [selectedTelegramTemplate, setSelectedTelegramTemplate] = useState<string>("")
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      fetchUserBalance()
      fetchCategories()
      checkEventLimit()
    }
  }, [user, router])

  useEffect(() => {
    if (user && selectedMethods.length > 0) {
      fetchContactCount()
    }
  }, [selectedMethods, formData.category, user])

  // Update email template when form data changes
  useEffect(() => {
    if (selectedEmailTemplate) {
      const template = emailTemplates.find(t => t.key === selectedEmailTemplate)
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
  }, [selectedEmailTemplate, formData.title, formData.description, formData.eventDate, formData.location, user])

  // Update telegram template when form data changes
  useEffect(() => {
    if (selectedTelegramTemplate) {
      const template = telegramTemplates.find(t => t.key === selectedTelegramTemplate)
      if (template) {
        const templateVars: TelegramTemplateVars = {
          firstName: "", // Will be replaced with actual contact name when sending
          eventTitle: formData.title || "Sample Event",
          eventDescription: formData.description || "",
          eventDate: format(formData.eventDate, "EEEE, MMMM do, yyyy 'at' h:mm a"),
          eventLocation: formData.location || "Sample Location",
          hostName: user?.user_metadata?.full_name || "Your Name",
          customMessage: formData.description || "",
        }
        const generatedTemplate = template.template(templateVars)
        setFormData(prev => ({ ...prev, telegramTemplate: generatedTemplate }))
      }
    }
  }, [selectedTelegramTemplate, formData.title, formData.description, formData.eventDate, formData.location, user])

  const handleMethodSelection = (methodId: string) => {
    setSelectedMethods(prev => {
      if (prev.includes(methodId)) {
        return prev.filter(id => id !== methodId)
      } else {
        return [...prev, methodId]
      }
    })
  }

  const handleContinueToForm = () => {
    if (selectedMethods.length === 0) {
      toast({
        title: "No Method Selected",
        description: "Please select at least one communication method.",
        variant: "destructive",
      })
      return
    }

    // Update form data based on selected methods
    const newFormData = { ...formData }
    newFormData.sendEmail = selectedMethods.includes('email')
    newFormData.sendTelegram = selectedMethods.includes('telegram')
    
    setFormData(newFormData)
    setShowOnboardingModal(false)
  }

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
      
      // Calculate total cost based on selected sending methods
      let totalCost = 0
      if (selectedMethods.includes('email')) {
        totalCost += count || 0
      }
      if (selectedMethods.includes('telegram')) {
        // For Telegram, we need to count only contacts with phone numbers
        let telegramContactsQuery = supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .not('phone', 'is', null)

        if (formData.category && formData.category !== "all") {
          telegramContactsQuery = telegramContactsQuery.eq('category', formData.category)
        }

        const { count: telegramCount } = await telegramContactsQuery
        totalCost += telegramCount || 0
      }
      
      setContactCount(totalCost)
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

  const checkEventLimit = async () => {
    try {
      if (!user) return
      const limitCheck = await canCreateEvent()
      setEventLimitCheck(limitCheck)
    } catch (error) {
      console.error('Error checking event limit:', error)
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

    // Check event creation limit
    if (eventLimitCheck && !eventLimitCheck.allowed) {
      const limitInfo = eventLimitCheck.maxAllowed === -1 ? 'unlimited' : eventLimitCheck.maxAllowed
      const upgradeRec = getLimitUpgradeRecommendation(eventLimitCheck.tier as any, 'events')
      
      toast({
        title: "Event Limit Reached",
        description: `You can only create up to ${limitInfo} events with your current plan. ${upgradeRec ? upgradeRec.reason : ''}`,
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
        telegram_template: formData.telegramTemplate,
        send_email: formData.sendEmail,
        send_telegram: formData.sendTelegram,
        status: formData.sendOption === "now" ? "draft" : "draft",
        scheduled_send_time: formData.sendOption === "schedule" ? formData.scheduledSendTime.toISOString() : null,
      }

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

  const handleInputChange = useCallback((field: string, value: string | Date | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleEmailTemplateSelect = useCallback((templateKey: string) => {
    setSelectedEmailTemplate(templateKey)
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

  const handleTelegramTemplateSelect = useCallback((templateKey: string) => {
    setSelectedTelegramTemplate(templateKey)
    const template = telegramTemplates.find(t => t.key === templateKey)
    if (template) {
      const templateVars: TelegramTemplateVars = {
        firstName: "", // Will be replaced with actual contact name when sending
        eventTitle: formData.title || "Sample Event",
        eventDescription: formData.description || "",
        eventDate: format(formData.eventDate, "EEEE, MMMM do, yyyy 'at' h:mm a"),
        eventLocation: formData.location || "Sample Location",
        hostName: user?.user_metadata?.full_name || "Your Name",
        customMessage: formData.description || "",
      }
      const generatedTemplate = template.template(templateVars)
      setFormData(prev => ({ ...prev, telegramTemplate: generatedTemplate }))
    }
  }, [formData.title, formData.description, formData.eventDate, formData.location, user])

  const getEmailTemplatePreview = () => {
    const template = emailTemplates.find(t => t.key === selectedEmailTemplate)
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

  const getTelegramTemplatePreview = () => {
    const template = telegramTemplates.find(t => t.key === selectedTelegramTemplate)
    if (!template) return ""
    
    const templateVars: TelegramTemplateVars = {
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
    }
  }

  if (!mounted) return null

  const totalCost = contactCount * PRICE_PER_EMAIL

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      {/* Onboarding Modal */}
      <Dialog open={showOnboardingModal} onOpenChange={setShowOnboardingModal}>
        <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              🎉 Welcome to Event Creation!
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              Choose how you'd like to send your event invitations
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {communicationMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => method.available && handleMethodSelection(method.id)}
                  disabled={!method.available}
                  className={`p-6 border-2 rounded-xl text-left transition-all ${
                    selectedMethods.includes(method.id)
                      ? "border-orange-500 bg-orange-50 shadow-lg"
                      : method.available
                      ? "border-gray-200 hover:border-gray-300 hover:shadow-md"
                      : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-2 rounded-lg ${
                      selectedMethods.includes(method.id) 
                        ? "bg-orange-100 text-orange-600" 
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {method.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{method.name}</h3>
                      {method.comingSoon && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{method.description}</p>
                  {!method.available && method.comingSoon && (
                    <div className="mt-3 flex items-center text-sm text-blue-600">
                      <Zap className="h-4 w-4 mr-1" />
                      We're working on this!
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Button
                onClick={handleContinueToForm}
                disabled={selectedMethods.length === 0}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-semibold"
              >
                Continue to Event Creation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Form */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Create New Event</h1>
                <p className="text-gray-600 text-sm md:text-base">
                  {selectedMethods.includes('email') && selectedMethods.includes('telegram') 
                    ? "Sending via Email & Telegram"
                    : selectedMethods.includes('email')
                    ? "Sending via Email"
                    : selectedMethods.includes('telegram')
                    ? "Sending via Telegram"
                    : "Choose your communication method"
                  }
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={() => setShowOnboardingModal(true)}
                size="sm"
              >
                Change Method
              </Button>
            </div>
          </div>

          <Card className="bg-white/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Event Information */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Event Details</h2>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Enter event title"
                      required
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
                </div>

                {/* Email Section */}
                {selectedMethods.includes('email') && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 flex items-center">
                      <Mail className="mr-2 h-5 w-5" />
                      Email Settings
                    </h2>
                    
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
                            onClick={() => handleEmailTemplateSelect(template.key)}
                            className={`p-4 border-2 rounded-lg text-left transition-all ${
                              selectedEmailTemplate === template.key
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
                      
                      {selectedEmailTemplate && (
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
                              setSelectedEmailTemplate("")
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
                  </div>
                )}

                {/* Telegram Section */}
                {selectedMethods.includes('telegram') && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 flex items-center">
                      <Send className="mr-2 h-5 w-5" />
                      Telegram Settings
                    </h2>
                    
                    <div className="space-y-4">
                      <Label>Telegram Template</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {telegramTemplates.map((template) => (
                          <button
                            key={template.key}
                            type="button"
                            onClick={() => handleTelegramTemplateSelect(template.key)}
                            className={`p-4 border-2 rounded-lg text-left transition-all ${
                              selectedTelegramTemplate === template.key
                                ? "border-blue-500 bg-blue-50"
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
                      
                      {selectedTelegramTemplate && (
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
                              setSelectedTelegramTemplate("")
                              setFormData(prev => ({ ...prev, telegramTemplate: "" }))
                            }}
                          >
                            Clear Template
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telegramTemplate">Telegram Template</Label>
                      <Textarea
                        id="telegramTemplate"
                        value={formData.telegramTemplate}
                        onChange={(e) => handleInputChange("telegramTemplate", e.target.value)}
                        placeholder="Select a template above or enter custom message"
                        rows={6}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        You can customize the Telegram message above. Use {'{{firstName}}'}, {'{{eventTitle}}'}, {'{{eventDate}}'}, {'{{eventLocation}}'} as placeholders. Supports HTML formatting.
                      </p>
                    </div>
                  </div>
                )}

                {/* Send Options */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Send Options</h2>
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

                {/* Cost Summary */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Cost Summary</h2>
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
                        <p className="text-sm text-muted-foreground">
                          {selectedMethods.includes('email') && selectedMethods.includes('telegram') ? `${contactCount} messages (email + telegram)` : 
                           selectedMethods.includes('email') ? `${contactCount} emails` : 
                           selectedMethods.includes('telegram') ? `${contactCount} telegram messages` : '0 messages'} × RM{PRICE_PER_EMAIL.toFixed(2)}
                        </p>
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

                    {eventLimitCheck && !eventLimitCheck.allowed && (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-orange-800 font-medium text-sm md:text-base">Event Limit Reached</p>
                            <p className="text-orange-600 text-sm">
                              You have reached your event limit ({eventLimitCheck.currentCount}/{eventLimitCheck.maxAllowed === -1 ? 'Unlimited' : eventLimitCheck.maxAllowed}).
                              {getLimitUpgradeRecommendation(eventLimitCheck.tier as any, 'events')?.reason}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2 border-orange-300 text-orange-700 hover:bg-orange-100"
                              onClick={() => router.push('/pricing')}
                            >
                              Upgrade Plan
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Purchase Additional Tokens</DialogTitle>
            <DialogDescription>
              Purchase additional tokens to create this event. You need {contactCount} tokens to send messages to all contacts in the selected category.
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

      {/* Template Preview Dialog */}
      <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
        <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview how your message will look when sent to recipients.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedMethods.includes('email') && selectedEmailTemplate && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Email Template</h3>
                <div 
                  className="border rounded-lg p-4 max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: getEmailTemplatePreview() }}
                />
              </div>
            )}
            {selectedMethods.includes('telegram') && selectedTelegramTemplate && (
              <div>
                <h3 className="font-semibold mb-2">Telegram Template</h3>
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50">
                  <pre className="whitespace-pre-wrap text-sm">{getTelegramTemplatePreview()}</pre>
                </div>
              </div>
            )}
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