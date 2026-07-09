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
import { discordTemplates, type DiscordTemplateVars } from "@/components/discord-templates"
import { slackTemplates, type SlackTemplateVars } from "@/components/slack-templates"
import { format } from "date-fns"
import { Mail, Send, MessageCircle, Smartphone, Zap, ArrowRight, AlertTriangle } from "lucide-react"
import { canCreateEventClient as canCreateEvent, getLimitInfo, getLimitUpgradeRecommendation } from "@/lib/subscription-limits-client"
import { countContactsByCategory, buildContactsQuery } from "@/lib/contact-filtering"
import RedesignedCreateEventPage from "@/components/events/create/redesigned-create-event-page"

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

const getCommunicationMethods = (userTier: string): CommunicationMethod[] => {
  const methods = [
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
      available: userTier === "basic" || userTier === "pro" || userTier === "enterprise",
      comingSoon: userTier === "free",
    },
    {
      id: "discord",
      name: "Discord",
      icon: <MessageCircle className="h-6 w-6" />,
      description: "Send one message to reach all contacts (1 token total)",
      available: userTier === "pro" || userTier === "enterprise",
      comingSoon: false,
    },
    {
      id: "slack",
      name: "Slack",
      icon: <MessageCircle className="h-6 w-6" />,
      description: "Send one message to reach all team members (1 token total)",
      available: userTier === "pro" || userTier === "enterprise",
      comingSoon: false,
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
    {
      id: "signal",
      name: "Signal",
      icon: <MessageCircle className="h-6 w-6" />,
      description: "Signal messaging",
      available: false,
      comingSoon: userTier === "pro" || userTier === "enterprise",
    },
    {
      id: "viber",
      name: "Viber",
      icon: <MessageCircle className="h-6 w-6" />,
      description: "Viber messaging",
      available: false,
      comingSoon: userTier === "pro" || userTier === "enterprise",
    },
  ]

  // Sort methods: available first, then coming soon, then unavailable
  return methods.sort((a, b) => {
    if (a.available && !b.available) return -1
    if (!a.available && b.available) return 1
    if (a.comingSoon && !b.comingSoon) return -1
    if (!a.comingSoon && b.comingSoon) return 1
    return 0
  })
}

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
  return <RedesignedCreateEventPage />

  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showOnboardingModal, setShowOnboardingModal] = useState(true)
  const [contactCount, setContactCount] = useState(0)
  const [userBalance, setUserBalance] = useState(0)
  const [userTier, setUserTier] = useState<string>("free")
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
    discordTemplate: "",
    slackTemplate: "",
    sendEmail: true,
    sendTelegram: false,
    sendDiscord: false,
    sendSlack: false,
    sendOption: "now" as SendOption,
    scheduledSendTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
  })
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<string>("")
  const [selectedTelegramTemplate, setSelectedTelegramTemplate] = useState<string>("")
  const [selectedDiscordTemplate, setSelectedDiscordTemplate] = useState<string>("")
  const [selectedSlackTemplate, setSelectedSlackTemplate] = useState<string>("")
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      fetchUserBalance()
      fetchUserTier()
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

  // Update discord template when form data changes
  useEffect(() => {
    if (selectedDiscordTemplate) {
      const template = discordTemplates.find(t => t.key === selectedDiscordTemplate)
      if (template) {
        const templateVars: DiscordTemplateVars = {
          firstName: "", // Will be replaced with actual contact name when sending
          eventTitle: formData.title || "Sample Event",
          eventDescription: formData.description || "",
          eventDate: format(formData.eventDate, "EEEE, MMMM do, yyyy 'at' h:mm a"),
          eventLocation: formData.location || "Sample Location",
          hostName: user?.user_metadata?.full_name || "Your Name",
          customMessage: formData.description || "",
        }
        const generatedTemplate = template.template(templateVars)
        setFormData(prev => ({ ...prev, discordTemplate: JSON.stringify(generatedTemplate) }))
      }
    }
  }, [selectedDiscordTemplate, formData.title, formData.description, formData.eventDate, formData.location, user])

  // Update slack template when form data changes
  useEffect(() => {
    if (selectedSlackTemplate) {
      const template = slackTemplates.find(t => t.key === selectedSlackTemplate)
      if (template) {
        const templateVars: SlackTemplateVars = {
          firstName: "", // Will be replaced with actual contact name when sending
          eventTitle: formData.title || "Sample Event",
          eventDescription: formData.description || "",
          eventDate: format(formData.eventDate, "EEEE, MMMM do, yyyy 'at' h:mm a"),
          eventLocation: formData.location || "Sample Location",
          hostName: user?.user_metadata?.full_name || "Your Name",
          customMessage: formData.description || "",
        }
        const generatedTemplate = template.template(templateVars)
        setFormData(prev => ({ ...prev, slackTemplate: JSON.stringify(generatedTemplate) }))
      }
    }
  }, [selectedSlackTemplate, formData.title, formData.description, formData.eventDate, formData.location, user])

  const handleMethodSelection = (methodId: string) => {
    // Check if user is trying to select Telegram but doesn't have access
    if (methodId === "telegram" && userTier === "free") {
      toast({
        title: "Telegram Not Available",
        description: "Telegram messaging is available for Basic and higher plans. Upgrade to unlock this feature!",
        variant: "destructive",
      })
      return
    }

    // Check if user is trying to select Discord but doesn't have access
    if (methodId === "discord" && (userTier === "free" || userTier === "basic")) {
      toast({
        title: "Discord Not Available",
        description: "Discord integration is available for Pro and Enterprise plans. Upgrade to unlock this feature!",
        variant: "destructive",
      })
      return
    }

    // Check if user is trying to select Slack but doesn't have access
    if (methodId === "slack" && (userTier === "free" || userTier === "basic")) {
      toast({
        title: "Slack Not Available",
        description: "Slack integration is available for Pro and Enterprise plans. Upgrade to unlock this feature!",
        variant: "destructive",
      })
      return
    }

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
    newFormData.sendDiscord = selectedMethods.includes('discord')
    newFormData.sendSlack = selectedMethods.includes('slack')
    
    setFormData(newFormData)
    setShowOnboardingModal(false)
  }

  const fetchContactCount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Use the utility function for accurate contact counting
      const contactsQuery = await countContactsByCategory(supabase, session.user.id, formData.category)
      const { count, error } = await contactsQuery

      if (error) throw error
      
      // Calculate total cost based on selected sending methods
      let totalCost = 0
      if (selectedMethods.includes('email')) {
        totalCost += count || 0
      }
      if (selectedMethods.includes('telegram')) {
        // For Telegram, we need to count only contacts with telegram chat IDs
        let telegramContactsQuery = supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .not('telegram_chat_id', 'is', null)

        if (formData.category && formData.category !== "all") {
          // Apply same category filtering for Telegram using the utility function
          const filterResult = await import('@/lib/contact-filtering').then(m => m.filterContactsByCategory(supabase, session.user.id, formData.category))
          
          if (filterResult.useNewSystem && filterResult.contactIds) {
            telegramContactsQuery = telegramContactsQuery.in('id', filterResult.contactIds)
          } else {
            telegramContactsQuery = telegramContactsQuery.eq('category', formData.category)
          }
        }

        const { count: telegramCount } = await telegramContactsQuery
        totalCost += telegramCount || 0
      }
      if (selectedMethods.includes('discord')) {
        // Discord costs only 1 token regardless of contact count
        totalCost += 1
      }
      if (selectedMethods.includes('slack')) {
        // Slack costs only 1 token regardless of contact count
        totalCost += 1
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

  const fetchUserTier = async () => {
    try {
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('tier, status')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subscriptionError)
      }
      
      if (subscriptionData && subscriptionData.status === 'active') {
        setUserTier(subscriptionData.tier)
      } else {
        setUserTier("free")
      }
    } catch (error) {
      console.error('Error fetching user tier:', error)
      setUserTier("free")
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

    // Check if free user is trying to schedule
    if (formData.sendOption === "schedule" && userTier === "free") {
      toast({
        title: "Schedule Send Unavailable",
        description: "Schedule send is available for Basic plans and above. Please upgrade to schedule your events.",
        variant: "destructive",
      })
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

      const eventData: any = {
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

      // Only add Discord fields if they exist (after migration)
      if (formData.sendDiscord && formData.discordTemplate) {
        eventData.discord_template = formData.discordTemplate
        eventData.send_discord = formData.sendDiscord
      }

      // Only add Slack fields if they exist (after migration)
      if (formData.sendSlack && formData.slackTemplate) {
        eventData.slack_template = formData.slackTemplate
        eventData.send_slack = formData.sendSlack
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

      // Get contacts for the event based on the event's category
      const contactsQuery = await buildContactsQuery(supabase, session.user.id, formData.category)

      const { data: contacts, error: contactsError } = await contactsQuery

      if (contactsError) {
        throw contactsError
      }

      if (!contacts || contacts.length === 0) {
        throw new Error("No contacts found for this event")
      }

      // Create event contacts immediately
      const eventContacts = contacts.map((contact) => ({
        event_id: event.id,
        contact_id: contact.id,
        status: "pending",
      }))

      const { error: eventContactsError } = await supabase
        .from("event_contacts")
        .insert(eventContacts)

      if (eventContactsError) {
        throw eventContactsError
      }

      console.log(`Created ${eventContacts.length} event contacts for event ${event.id}`)

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
    // Prevent free users from changing to schedule mode
    if (field === "sendOption" && value === "schedule" && userTier === "free") {
      toast({
        title: "Schedule Send Unavailable",
        description: "Schedule send is available for Basic plans and above. Please upgrade to schedule your events.",
        variant: "destructive",
      })
      return
    }
    
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [userTier])

  const handleEmailTemplateSelect = useCallback((templateKey: string) => {
    // Free users can only use generic template
    if (userTier === "free" && templateKey !== "generic") {
      toast({
        title: "Advanced Templates Unavailable",
        description: "Advanced email templates are available for Basic plans and above. Please upgrade to access specialized templates.",
        variant: "destructive",
      })
      return
    }
    
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
  }, [formData.title, formData.description, formData.eventDate, formData.location, user, userTier])

  // Auto-select generic template for free users
  useEffect(() => {
    if (userTier === "free" && selectedMethods.includes('email') && !selectedEmailTemplate) {
      handleEmailTemplateSelect("generic")
    }
  }, [userTier, selectedMethods, selectedEmailTemplate, handleEmailTemplateSelect])

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

  const handleDiscordTemplateSelect = useCallback((templateKey: string) => {
    setSelectedDiscordTemplate(templateKey)
    const template = discordTemplates.find(t => t.key === templateKey)
    if (template) {
      const templateVars: DiscordTemplateVars = {
        firstName: "", // Will be replaced with actual contact name when sending
        eventTitle: formData.title || "Sample Event",
        eventDescription: formData.description || "",
        eventDate: format(formData.eventDate, "EEEE, MMMM do, yyyy 'at' h:mm a"),
        eventLocation: formData.location || "Sample Location",
        hostName: user?.user_metadata?.full_name || "Your Name",
        customMessage: formData.description || "",
      }
      const generatedTemplate = template.template(templateVars)
      setFormData(prev => ({ ...prev, discordTemplate: JSON.stringify(generatedTemplate) }))
    }
  }, [formData.title, formData.description, formData.eventDate, formData.location, user])

  const handleSlackTemplateSelect = useCallback((templateKey: string) => {
    setSelectedSlackTemplate(templateKey)
    const template = slackTemplates.find(t => t.key === templateKey)
    if (template) {
      const templateVars: SlackTemplateVars = {
        firstName: "", // Will be replaced with actual contact name when sending
        eventTitle: formData.title || "Sample Event",
        eventDescription: formData.description || "",
        eventDate: format(formData.eventDate, "EEEE, MMMM do, yyyy 'at' h:mm a"),
        eventLocation: formData.location || "Sample Location",
        hostName: user?.user_metadata?.full_name || "Your Name",
        customMessage: formData.description || "",
      }
      const generatedTemplate = template.template(templateVars)
      setFormData(prev => ({ ...prev, slackTemplate: JSON.stringify(generatedTemplate) }))
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

  const getDiscordTemplatePreview = () => {
    const template = discordTemplates.find(t => t.key === selectedDiscordTemplate)
    if (!template) return null
    
    const templateVars: DiscordTemplateVars = {
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

  const getSlackTemplatePreview = () => {
    const template = slackTemplates.find(t => t.key === selectedSlackTemplate)
    if (!template) return null
    
    const templateVars: SlackTemplateVars = {
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
    <div className="min-h-screen bg-gradient-to-b from-background via-card/20 to-background">
      {/* Onboarding Modal */}
      <Dialog open={showOnboardingModal} onOpenChange={setShowOnboardingModal}>
        <DialogContent className="mx-auto max-h-[90vh] w-[95vw] max-w-md overflow-y-auto border-border bg-popover text-popover-foreground sm:max-w-2xl">
          <DialogHeader className="px-4 sm:px-0">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
              🎉 Welcome to Event Creation!
            </DialogTitle>
            <DialogDescription className="text-center text-sm sm:text-lg">
              Choose how you'd like to send your event invitations
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 sm:py-6 px-4 sm:px-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {getCommunicationMethods(userTier).map((method: CommunicationMethod) => (
                <button
                  key={method.id}
                  onClick={() => method.available && handleMethodSelection(method.id)}
                  disabled={!method.available}
                  className={`min-h-[120px] rounded-xl border-2 p-4 text-left transition-all sm:min-h-[140px] sm:p-6 ${
                    selectedMethods.includes(method.id)
                      ? "border-primary bg-primary/10 shadow-lg"
                      : method.available
                      ? "border-border hover:border-primary/40 hover:shadow-md"
                      : "cursor-not-allowed border-border/60 bg-muted/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                    <div
                      className={`flex-shrink-0 rounded-lg p-2 ${
                        selectedMethods.includes(method.id)
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {method.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base sm:text-lg truncate">{method.name}</h3>
                      {method.comingSoon && (
                        <span className="mt-1 inline-flex items-center rounded-full bg-sky-500/15 px-2 py-1 text-xs font-medium text-sky-700 dark:text-sky-300">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="line-clamp-3 text-xs text-muted-foreground sm:text-sm">{method.description}</p>
                  {!method.available && method.comingSoon && (
                    <div className="mt-2 flex items-center text-xs text-primary sm:mt-3 sm:text-sm">
                      <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      We're working on this!
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Upgrade Prompt for Free/Basic Users */}
            {(userTier === "free" || userTier === "basic") && (
              <div className="mx-4 mt-4 rounded-lg border border-primary/35 bg-primary/10 p-3 sm:mx-0 sm:mt-6 sm:p-4">
                <div className="mb-2 flex items-start gap-2 sm:mb-3 sm:gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary sm:h-5 sm:w-5" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground sm:text-base">Unlock More Features</h3>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                      {userTier === "free" 
                        ? "Upgrade to Basic to unlock Telegram messaging and more features."
                        : userTier === "basic"
                        ? "Upgrade to Pro to unlock Discord and Slack integrations and unlimited events."
                        : "You have access to all features!"
                      }
                    </p>
                    <Button
                      onClick={() => router.push('/pricing')}
                      size="sm"
                      className="mt-2 bg-primary text-xs text-primary-foreground hover:bg-primary/90 sm:text-sm"
                    >
                      View Plans
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 sm:mt-6 text-center px-4 sm:px-0">
              <Button
                onClick={handleContinueToForm}
                disabled={selectedMethods.length === 0}
                className="w-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto sm:px-8 sm:text-base"
              >
                Continue to Event Creation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Form */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        <div className="max-w-4xl mx-auto w-full">
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="mb-1 text-xl font-bold text-foreground sm:mb-2 sm:text-2xl md:text-3xl">Create New Event</h1>
                <p className="text-xs text-muted-foreground sm:text-sm md:text-base">
                  {selectedMethods.includes('email') && selectedMethods.includes('telegram') && selectedMethods.includes('discord')
                    ? "Sending via Email, Telegram & Discord"
                    : selectedMethods.includes('email') && selectedMethods.includes('telegram')
                    ? "Sending via Email & Telegram"
                    : selectedMethods.includes('email') && selectedMethods.includes('discord')
                    ? "Sending via Email & Discord"
                    : selectedMethods.includes('telegram') && selectedMethods.includes('discord')
                    ? "Sending via Telegram & Discord"
                    : selectedMethods.includes('email')
                    ? "Sending via Email"
                    : selectedMethods.includes('telegram')
                    ? "Sending via Telegram"
                    : selectedMethods.includes('discord')
                    ? "Sending via Discord"
                    : "Choose your communication method"
                  }
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={() => setShowOnboardingModal(true)}
                size="sm"
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                Change Method
              </Button>
            </div>
          </div>

          <Card className="border border-border/80 bg-card">
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Basic Event Information */}
                <div className="space-y-4">
                  <h2 className="border-b pb-2 text-xl font-semibold text-foreground">Event Details</h2>
                  
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
                      earliestAllowed={new Date()}
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
                    <h2 className="text-xl font-semibold text-foreground border-b pb-2 flex items-center">
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                        {emailTemplates.map((template) => {
                          // Free users can only use generic template
                          const isDisabled = userTier === "free" && template.key !== "generic"
                          const isSelected = selectedEmailTemplate === template.key
                          
                          return (
                            <button
                              key={template.key}
                              type="button"
                              onClick={() => !isDisabled && handleEmailTemplateSelect(template.key)}
                              disabled={isDisabled}
                              className={`p-3 sm:p-4 border-2 rounded-lg text-left transition-all min-h-[80px] sm:min-h-[100px] ${
                                isSelected
                                  ? "border-primary bg-primary/10"
                                  : isDisabled
                                  ? "cursor-not-allowed border-border/60 bg-muted/50 opacity-60"
                                  : "border-border hover:border-primary/40"
                              }`}
                            >
                              <div className="font-medium text-xs sm:text-sm flex items-center justify-between">
                                <span className="truncate">{template.label}</span>
                                {isDisabled && (
                                  <span className="ml-1 inline-flex flex-shrink-0 items-center rounded-full bg-sky-500/15 px-1.5 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">
                                    Basic+
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {template.key === "birthday" && "🎉"}
                                {template.key === "openHouse" && "🏡"}
                                {template.key === "wedding" && "💍"}
                                {template.key === "meeting" && "📅"}
                                {template.key === "babyShower" && "👶"}
                                {template.key === "generic" && "📧"}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                      
                      {/* Upgrade prompt for free users */}
                      {userTier === "free" && (
                        <div className="rounded-lg border border-primary/35 bg-primary/10 p-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground">Advanced Templates Unavailable</p>
                              <p className="text-xs text-muted-foreground">
                                Advanced email templates are available for Basic plans and above. Upgrade to access birthday, wedding, meeting, and other specialized templates.
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2 border-primary/40 text-primary hover:bg-primary/10 text-xs"
                                onClick={() => router.push('/pricing')}
                              >
                                View Plans
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      
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
                      <p className="text-xs text-muted-foreground">
                        You can customize the template HTML above. Use {'{{firstName}}'}, {'{{eventTitle}}'}, {'{{eventDate}}'}, {'{{eventLocation}}'} as placeholders.
                      </p>
                    </div>
                  </div>
                )}

                {/* Telegram Section */}
                {selectedMethods.includes('telegram') && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground border-b pb-2 flex items-center">
                      <Send className="mr-2 h-5 w-5" />
                      Telegram Settings
                    </h2>
                    
                    <div className="space-y-4">
                      <Label>Telegram Template</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                        {telegramTemplates.map((template) => (
                          <button
                            key={template.key}
                            type="button"
                            onClick={() => handleTelegramTemplateSelect(template.key)}
                            className={`min-h-[80px] rounded-lg border-2 p-3 text-left transition-all sm:min-h-[100px] sm:p-4 ${
                              selectedTelegramTemplate === template.key
                                ? "border-sky-500/50 bg-sky-500/10"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            <div className="font-medium text-xs sm:text-sm truncate">{template.label}</div>
                            <div className="text-xs text-muted-foreground mt-1">
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
                      <p className="text-xs text-muted-foreground">
                        You can customize the Telegram message above. Use {'{{firstName}}'}, {'{{eventTitle}}'}, {'{{eventDate}}'}, {'{{eventLocation}}'} as placeholders. Supports HTML formatting.
                      </p>
                    </div>
                  </div>
                )}

                {/* Discord Section */}
                {selectedMethods.includes('discord') && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground border-b pb-2 flex items-center">
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Discord Settings
                    </h2>
                    
                    <div className="rounded-lg border border-primary/35 bg-primary/10 p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">Discord Integration Required</p>
                          <p className="text-xs text-muted-foreground">
                            You need to configure your Discord webhook in settings before sending Discord messages.{" "}
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                              onClick={() => router.push('/dashboard/discord-settings')}
                            >
                              Configure Discord Settings
                            </Button>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Label>Discord Template</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        {discordTemplates.map((template) => (
                          <button
                            key={template.key}
                            type="button"
                            onClick={() => handleDiscordTemplateSelect(template.key)}
                            className={`p-3 sm:p-4 border-2 rounded-lg text-left transition-all min-h-[80px] sm:min-h-[100px] ${
                              selectedDiscordTemplate === template.key
                                ? "border-violet-500/50 bg-violet-500/10"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            <div className="font-medium text-xs sm:text-sm truncate">{template.label}</div>
                            <div className="text-xs text-muted-foreground mt-1">
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
                      
                      {selectedDiscordTemplate && (
                        <div className="flex flex-col sm:flex-row gap-2 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowTemplatePreview(true)}
                            className="w-full sm:w-auto"
                          >
                            Preview Template
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDiscordTemplate("")
                              setFormData(prev => ({ ...prev, discordTemplate: "" }))
                            }}
                            className="w-full sm:w-auto"
                          >
                            Clear Template
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discordTemplate">Discord Template (JSON)</Label>
                      <Textarea
                        id="discordTemplate"
                        value={formData.discordTemplate}
                        onChange={(e) => handleInputChange("discordTemplate", e.target.value)}
                        placeholder="Select a template above or enter custom Discord embed JSON"
                        rows={8}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Discord uses rich embeds with JSON format. Select a template above for the best experience, or customize the JSON manually.
                      </p>
                    </div>
                  </div>
                )}

                {/* Slack Section */}
                {selectedMethods.includes('slack') && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground border-b pb-2 flex items-center">
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Slack Settings
                    </h2>
                    
                    <div className="rounded-lg border border-primary/35 bg-primary/10 p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">Slack Integration Required</p>
                          <p className="text-xs text-muted-foreground">
                            You need to configure your Slack webhook in settings before sending Slack messages.{" "}
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                              onClick={() => router.push('/dashboard/slack-settings')}
                            >
                              Configure Slack Settings
                            </Button>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Label>Slack Template</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        {slackTemplates.map((template) => (
                          <button
                            key={template.key}
                            type="button"
                            onClick={() => handleSlackTemplateSelect(template.key)}
                            className={`p-3 sm:p-4 border-2 rounded-lg text-left transition-all min-h-[80px] sm:min-h-[100px] ${
                              selectedSlackTemplate === template.key
                                ? "border-violet-500/50 bg-violet-500/10"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            <div className="font-medium text-xs sm:text-sm truncate">{template.label}</div>
                            <div className="text-xs text-muted-foreground mt-1">
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
                      
                      {selectedSlackTemplate && (
                        <div className="flex flex-col sm:flex-row gap-2 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowTemplatePreview(true)}
                            className="w-full sm:w-auto"
                          >
                            Preview Template
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSlackTemplate("")
                              setFormData(prev => ({ ...prev, slackTemplate: "" }))
                            }}
                            className="w-full sm:w-auto"
                          >
                            Clear Template
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="slackTemplate">Slack Template (JSON)</Label>
                      <Textarea
                        id="slackTemplate"
                        value={formData.slackTemplate}
                        onChange={(e) => handleInputChange("slackTemplate", e.target.value)}
                        placeholder="Select a template above or enter custom Slack Block Kit JSON"
                        rows={8}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Slack uses Block Kit format with JSON. Select a template above for the best experience, or customize the JSON manually.
                      </p>
                    </div>
                  </div>
                )}

                {/* Send Options */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground border-b pb-2">Send Options</h2>
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
                        disabled={userTier === "free"}
                        className="h-4 w-4"
                      />
                      <Label 
                        htmlFor="schedule" 
                        className={`text-sm ${userTier === "free" ? "cursor-not-allowed text-muted-foreground" : ""}`}
                      >
                        Schedule Send
                        {userTier === "free" && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-sky-500/15 px-2 py-1 text-xs font-medium text-sky-700 dark:text-sky-300">
                            Basic+
                          </span>
                        )}
                      </Label>
                    </div>
                    
                    {/* Upgrade prompt for free users */}
                    {userTier === "free" && (
                      <div className="rounded-lg border border-primary/35 bg-primary/10 p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">Schedule Send Unavailable</p>
                            <p className="text-xs text-muted-foreground">
                              Schedule send is available for Basic plans and above. Upgrade to schedule your events in advance.
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2 border-primary/40 text-primary hover:bg-primary/10 text-xs"
                              onClick={() => router.push('/pricing')}
                            >
                              View Plans
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {formData.sendOption === "schedule" && (
                    <div className="space-y-2">
                      <Label>Schedule Send Time</Label>
                      <DateTimePicker
                        date={formData.scheduledSendTime}
                        onSelect={(date) => handleInputChange("scheduledSendTime", date)}
                        earliestAllowed={new Date()}
                      />
                    </div>
                  )}
                </div>

                {/* Cost Summary */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground border-b pb-2">Cost Summary</h2>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 p-3 sm:p-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium sm:text-base">Current Balance</p>
                        <p className="text-xs text-muted-foreground sm:text-sm">{userBalance} tokens</p>
                      </div>
                      <p className="ml-2 flex-shrink-0 text-lg font-bold text-primary sm:text-xl md:text-2xl">
                        RM{(userBalance * PRICE_PER_EMAIL).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 p-3 sm:p-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium sm:text-base">Event Cost</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {selectedMethods.includes('email') && selectedMethods.includes('telegram') && selectedMethods.includes('discord') && selectedMethods.includes('slack') ? `${contactCount} messages (email + telegram + discord + slack)` : 
                           selectedMethods.includes('email') && selectedMethods.includes('telegram') && selectedMethods.includes('discord') ? `${contactCount} messages (email + telegram + discord)` : 
                           selectedMethods.includes('email') && selectedMethods.includes('telegram') && selectedMethods.includes('slack') ? `${contactCount} messages (email + telegram + slack)` : 
                           selectedMethods.includes('email') && selectedMethods.includes('discord') && selectedMethods.includes('slack') ? `${contactCount} messages (email + discord + slack)` : 
                           selectedMethods.includes('telegram') && selectedMethods.includes('discord') && selectedMethods.includes('slack') ? `${contactCount} messages (telegram + discord + slack)` : 
                           selectedMethods.includes('email') && selectedMethods.includes('telegram') ? `${contactCount} messages (email + telegram)` : 
                           selectedMethods.includes('email') && selectedMethods.includes('discord') ? `${contactCount} messages (email + discord)` : 
                           selectedMethods.includes('email') && selectedMethods.includes('slack') ? `${contactCount} messages (email + slack)` : 
                           selectedMethods.includes('telegram') && selectedMethods.includes('discord') ? `${contactCount} messages (telegram + discord)` : 
                           selectedMethods.includes('telegram') && selectedMethods.includes('slack') ? `${contactCount} messages (telegram + slack)` : 
                           selectedMethods.includes('discord') && selectedMethods.includes('slack') ? `2 messages (discord + slack)` : 
                           selectedMethods.includes('email') ? `${contactCount} emails` : 
                           selectedMethods.includes('telegram') ? `${contactCount} telegram messages` : 
                           selectedMethods.includes('discord') ? `1 Discord message` : 
                           selectedMethods.includes('slack') ? `1 Slack message` : '0 messages'} × RM{PRICE_PER_EMAIL.toFixed(2)}
                        </p>
                      </div>
                      <p className="ml-2 flex-shrink-0 text-lg font-bold text-primary sm:text-xl md:text-2xl">
                        RM{totalCost.toFixed(2)}
                      </p>
                    </div>

                    {userBalance < contactCount && (
                      <div className="rounded-lg border border-destructive/35 bg-destructive/10 p-4">
                        <p className="text-sm font-medium text-destructive md:text-base">Insufficient Balance</p>
                        <p className="text-sm text-muted-foreground">
                          You need {contactCount - userBalance} more tokens to create this event.
                        </p>
                      </div>
                    )}

                    {eventLimitCheck && !eventLimitCheck.allowed && (
                      <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-3 sm:p-4">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400 sm:h-5 sm:w-5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground sm:text-base">Event Limit Reached</p>
                            <p className="text-xs text-muted-foreground sm:text-sm">
                              You have reached your event limit ({eventLimitCheck.currentCount}/{eventLimitCheck.maxAllowed === -1 ? 'Unlimited' : eventLimitCheck.maxAllowed}).
                              {getLimitUpgradeRecommendation(eventLimitCheck.tier as any, 'events')?.reason}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2 border-amber-500/40 text-amber-800 hover:bg-amber-500/10 dark:text-amber-200 text-xs"
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

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard/events')}
                    className="flex-1 h-12 sm:h-10 text-sm sm:text-base"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || contactCount === 0}
                    className="h-12 flex-1 bg-primary text-sm text-primary-foreground hover:bg-primary/90 sm:h-10 sm:text-base"
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
        <DialogContent className="mx-auto w-[95vw] max-w-md border-border bg-popover text-popover-foreground">
          <DialogHeader className="px-4 sm:px-0">
            <DialogTitle className="text-lg sm:text-xl">Purchase Additional Tokens</DialogTitle>
            <DialogDescription className="text-sm">
              Purchase additional tokens to create this event. You need {contactCount} tokens to send messages to all contacts in the selected category.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 px-4 sm:px-0">
            <div className="mb-4 text-center">
              <p className="text-xl font-bold text-primary sm:text-2xl">
                RM {totalCost.toFixed(2)}
              </p>
              <p className="text-muted-foreground text-sm">{contactCount} tokens needed</p>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <Button 
                onClick={handlePayment}
                disabled={isLoading}
                className="h-12 w-full bg-primary text-sm text-primary-foreground hover:bg-primary/90 sm:text-base"
              >
                {isLoading ? "Processing..." : "Purchase Tokens"}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
                className="w-full h-12 text-sm sm:text-base"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
        <DialogContent className="mx-auto max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto border-border bg-popover text-popover-foreground">
          <DialogHeader className="px-4 sm:px-0">
            <DialogTitle className="text-lg sm:text-xl">Template Preview</DialogTitle>
            <DialogDescription className="text-sm">
              Preview how your message will look when sent to recipients.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 px-4 sm:px-0">
            {selectedMethods.includes('email') && selectedEmailTemplate && (
              <div className="mb-4 sm:mb-6">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Email Template</h3>
                <div 
                  className="border rounded-lg p-3 sm:p-4 max-h-64 sm:max-h-96 overflow-y-auto text-xs sm:text-sm"
                  dangerouslySetInnerHTML={{ __html: getEmailTemplatePreview() }}
                />
              </div>
            )}
            {selectedMethods.includes('telegram') && selectedTelegramTemplate && (
              <div className="mb-4 sm:mb-6">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Telegram Template</h3>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-muted/40 p-3 sm:max-h-96 sm:p-4">
                  <pre className="whitespace-pre-wrap text-xs sm:text-sm">{getTelegramTemplatePreview()}</pre>
                </div>
              </div>
            )}
            {selectedMethods.includes('discord') && selectedDiscordTemplate && (
              <div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Discord Template</h3>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-muted/40 p-3 sm:max-h-96 sm:p-4">
                  <pre className="whitespace-pre-wrap text-xs sm:text-sm">{JSON.stringify(getDiscordTemplatePreview(), null, 2)}</pre>
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline"
                onClick={() => setShowTemplatePreview(false)}
                className="text-sm sm:text-base"
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