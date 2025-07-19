"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { CheckCircle, Send, User, Mail, Phone, MessageCircle, ArrowRight, Copy, ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface OnboardingLink {
  id: string
  title: string
  description: string
  expires_at: string | null
  max_uses: number
  current_uses: number
}

export default function OnboardingPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  
  const [link, setLink] = useState<OnboardingLink | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showTelegramHelp, setShowTelegramHelp] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    telegram_chat_id: "",
    notes: "",
  })

  useEffect(() => {
    fetchLink()
  }, [token])

  const fetchLink = async () => {
    try {
      const response = await fetch(`/api/onboarding-links/${token}`)
      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Invalid or expired link",
          variant: "destructive",
        })
        router.push("/")
        return
      }

      setLink(data)
    } catch (error: any) {
      console.error("Error fetching link:", error)
      toast({
        title: "Error",
        description: "Failed to load the onboarding link",
        variant: "destructive",
      })
      router.push("/")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.first_name || !formData.email) {
      toast({
        title: "Required Fields",
        description: "First name and email are required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/onboarding-links/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit form")
      }

      setIsSuccess(true)
      toast({
        title: "Success!",
        description: `Contact ${data.action} successfully`,
      })
    } catch (error: any) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit form",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
    })
  }

  const getTelegramChatId = async () => {
    try {
      // Open Telegram bot chat
      const botUsername = "sunrisemy_2025_bot" // Replace with your actual bot username
      window.open(`https://t.me/${botUsername}`, "_blank")
      
      setShowTelegramHelp(true)
    } catch (error) {
      console.error("Error opening Telegram:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Success!</h1>
            <p className="text-gray-600 mb-6">
              You've been successfully added to the contact list. You'll now receive event invitations and updates.
            </p>
            <Button
              onClick={() => window.close()}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-800 mb-2">
              {link?.title || "Join Contact List"}
            </CardTitle>
            <p className="text-gray-600 text-lg">
              {link?.description || "Add yourself to receive event invitations and updates"}
            </p>
            
            {/* Link Usage Info */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                📊 {link?.current_uses || 0} of {link?.max_uses || 100} people have joined
                {link?.expires_at && (
                  <span className="block mt-1">
                    ⏰ Expires: {new Date(link.expires_at).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange("first_name", e.target.value)}
                      placeholder="Enter your first name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange("last_name", e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>

              {/* Contact Methods */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Phone className="mr-2 h-5 w-5" />
                  Contact Methods
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telegram_chat_id" className="flex items-center">
                    <MessageCircle className="mr-2 h-4 w-4" />
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
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id="telegram_chat_id"
                      value={formData.telegram_chat_id}
                      onChange={(e) => handleInputChange("telegram_chat_id", e.target.value)}
                      placeholder="Enter your Telegram Chat ID"
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
                    This allows us to send you Telegram messages for events
                  </p>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Additional Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Any additional information you'd like to share..."
                    rows={3}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Add Me to Contact List
                  </>
                )}
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
              <MessageCircle className="mr-2 h-5 w-5" />
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
                Click the button below to open a chat with our bot:
              </p>
              <Button
                onClick={() => window.open("https://t.me/sunrisemy_2025_bot", "_blank")}
                className="w-full"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Telegram Bot
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
                Send any message to the bot (like "hello" or "/start") and it will reply with your Chat ID. Copy that number and paste it in the form above.
              </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>Tip:</strong> Your Chat ID is a number like "123456789". It's unique to your Telegram account.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 