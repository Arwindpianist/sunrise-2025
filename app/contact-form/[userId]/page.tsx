"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Users, Mail, Phone, Calendar, MessageSquare, Bot, ExternalLink } from "lucide-react"
import { use } from "react"

interface UserProfile {
  id: string
  full_name?: string
  email?: string
}

export default function ContactFormPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const router = useParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showTelegramHelp, setShowTelegramHelp] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    telegram_chat_id: "",
    category: "__no_category__",
    notes: "",
  })

  useEffect(() => {
    fetchUserProfile()
    fetchCategories()
  }, [userId])

  const fetchUserProfile = async () => {
    try {
      // Use our API endpoint to fetch user information
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const profile = await response.json()
        console.log('User profile fetched:', profile)
        setUserProfile(profile)
      } else {
        console.error('Error fetching user profile:', response.statusText)
        // Set a basic user profile as fallback
        setUserProfile({
          id: userId,
          full_name: undefined,
          email: undefined,
        })
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Set a basic user profile as fallback
      setUserProfile({
        id: userId,
        full_name: undefined,
        email: undefined,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/contacts/categories?user_id=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Split full_name into first_name and last_name
      const nameParts = formData.full_name.trim().split(' ')
      const first_name = nameParts[0] || ''
      const last_name = nameParts.slice(1).join(' ') || ''

      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name,
          last_name,
          email: formData.email,
          phone: formData.phone,
          telegram_chat_id: formData.telegram_chat_id,
          category: formData.category === "__no_category__" ? "" : formData.category,
          notes: formData.notes,
          user_id: userId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit form")
      }

      const result = await response.json()

      toast({
        title: "Success!",
        description: "Your contact information has been submitted successfully.",
      })

      // Reset form
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        telegram_chat_id: "",
        category: "__no_category__",
        notes: "",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit form",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }

  const getTelegramChatId = async () => {
    try {
      // Open Telegram userinfobot chat
      const botUsername = "userinfobot"
      window.open(`https://t.me/${botUsername}`, "_blank")
      
      setShowTelegramHelp(true)
    } catch (error) {
      console.error("Error opening Telegram:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-orange-500 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading form...</p>
        </div>
      </div>
    )
  }

  const userName = userProfile?.full_name || 
                   userProfile?.email?.split('@')[0] || 
                   'Sunrise Circle Host'

  const displayName = userProfile?.full_name ? 
                     `${userProfile.full_name}'s Sunrise Circle` : 
                     userProfile?.email ? 
                     `${userProfile.email.split('@')[0]}'s Sunrise Circle` :
                     'Sunrise Circle'

  const hostName = userProfile?.full_name || 
                   userProfile?.email?.split('@')[0] || 
                   'the host'

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardHeader className="text-center px-4 sm:px-6">
            <div className="mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-400 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                Join {displayName}
              </CardTitle>
              <p className="text-gray-600 text-base sm:text-lg">
                Share your contact information to stay connected with {hostName}
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2 text-sm sm:text-base">
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                Why we're collecting this information
              </h3>
              <p className="text-blue-700 text-xs sm:text-sm leading-relaxed">
                This form is to collect your information on behalf of <strong>{hostName}</strong> to be added into their Sunrise Circle. 
                This will help them inform you of any sunrise occasions, events, and special moments easily. 
                Your information will only be used for event notifications and will be kept private and secure.
              </p>
            </div>

            {/* Host Information */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <h3 className="font-semibold text-orange-800 mb-2 flex items-center gap-2 text-sm sm:text-base">
                <Users className="h-4 w-4 flex-shrink-0" />
                Host Information
              </h3>
              <div className="text-orange-700 text-xs sm:text-sm">
                <p className="mb-1">
                  <strong>Host:</strong> {hostName}
                </p>
                {userProfile?.email && (
                  <p>
                    <strong>Email:</strong> {userProfile.email}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <label htmlFor="full_name" className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  Full Name *
                </label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="text-base"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  Email Address *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  className="text-base"
                  required
                />
                <p className="text-xs text-gray-500">
                  This is how {hostName} will send you event invitations and updates
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  Phone Number
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+60 12-345 6789"
                  className="text-base"
                />
                <p className="text-xs text-gray-500">
                  Optional - for urgent event updates or reminders
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="telegram_chat_id" className="text-sm font-medium flex items-center gap-2">
                  <Bot className="h-4 w-4 flex-shrink-0" />
                  Telegram Chat ID
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getTelegramChatId}
                    className="ml-2 h-6 px-2 text-xs"
                  >
                    Get ID
                  </Button>
                </label>
                <div className="flex space-x-2">
                  <Input
                    id="telegram_chat_id"
                    name="telegram_chat_id"
                    value={formData.telegram_chat_id}
                    onChange={handleChange}
                    placeholder="Enter your Telegram Chat ID"
                    className="text-base"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTelegramHelp(true)}
                    className="px-3"
                  >
                    Help
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  This allows {hostName} to send you Telegram messages for events
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  How do you know {hostName}?
                </label>
                <Select
                  value={formData.category || "__no_category__"}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger className="text-base">
                    <SelectValue placeholder="Select your relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__no_category__">I prefer not to specify</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="truncate">{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  This helps {hostName} organize their contacts and send relevant updates
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Additional Notes
                </label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Any additional information you'd like to share..."
                  className="text-base resize-none"
                />
                <p className="text-xs text-gray-500">
                  Optional - dietary preferences, accessibility needs, or other important details
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs text-gray-600 text-center leading-relaxed">
                  By submitting this form, you agree to receive event-related communications from {hostName}. 
                  Your information will be kept private and secure.
                </p>
              </div>

              <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Join Sunrise Circle"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Telegram Help Dialog */}
      <Dialog open={showTelegramHelp} onOpenChange={setShowTelegramHelp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Bot className="mr-2 h-5 w-5" />
              How to Get Your Telegram Chat ID
            </DialogTitle>
            <DialogDescription>
              Follow these steps to get your Telegram Chat ID:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Step 1: Start a Chat</h4>
              <p className="text-sm text-gray-600">
                Click the button below to open a chat with @userinfobot:
              </p>
              <Button
                onClick={() => window.open("https://t.me/userinfobot", "_blank")}
                className="w-full"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open @userinfobot
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Step 2: Send a Message</h4>
              <p className="text-sm text-gray-600">
                Send any message to the bot (like "hello" or "/start")
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Step 3: Get Your Chat ID</h4>
              <p className="text-sm text-gray-600">
                The bot will reply with your Chat ID (a number like "123456789"). Copy that number and paste it in the form above.
              </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>Tip:</strong> Your Chat ID is a number like "123456789". It's unique to your Telegram account and works for any bot or service.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
 