"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { toast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Users, Mail, Phone, Calendar, MessageSquare, Bot } from "lucide-react"
import { use } from "react"

interface UserProfile {
  id: string
  full_name?: string
  email?: string
}

export default function ContactFormPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
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
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          // Split full_name into first_name and last_name for database compatibility
          first_name: formData.full_name.split(' ')[0] || '',
          last_name: formData.full_name.split(' ').slice(1).join(' ') || '',
          category: formData.category === "__no_category__" ? "" : formData.category,
          user_id: userId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit form")
      }

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

  const userName = userProfile?.full_name || userProfile?.email?.split('@')[0] || `User ${userId.slice(0, 8)}`

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
                Join {userName}'s Sunrise Circle
              </CardTitle>
              <p className="text-gray-600 text-base sm:text-lg">
                Share your contact information to stay connected
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2 text-sm sm:text-base">
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                Why we're collecting this information
              </h3>
              <p className="text-blue-700 text-xs sm:text-sm leading-relaxed">
                This form is to collect your information on behalf of <strong>{userName}</strong> to be added into their Sunrise Circle. 
                This will help them inform you of any sunrise occasions, events, and special moments easily. 
                Your information will only be used for event notifications and will be kept private and secure.
              </p>
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
                  This is how {userName} will send you event invitations and updates
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
                </label>
                <Input
                  id="telegram_chat_id"
                  name="telegram_chat_id"
                  value={formData.telegram_chat_id}
                  onChange={handleChange}
                  placeholder="e.g., 123456789"
                  className="text-base"
                />
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>How to find your Telegram Chat ID:</strong>
                    <br />
                    1. Open Telegram and search for "@userinfobot"
                    <br />
                    2. Start a chat with the bot by clicking "Start"
                    <br />
                    3. The bot will reply with your Chat ID (a number like 123456789)
                    <br />
                    4. Copy that number and paste it above
                    <br />
                    <em>This allows {userName} to send you Telegram messages for events</em>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  How do you know {userName}?
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
                  This helps {userName} organize their contacts and send relevant updates
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
                  By submitting this form, you agree to receive event-related communications from {userName}. 
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
    </div>
  )
}
 