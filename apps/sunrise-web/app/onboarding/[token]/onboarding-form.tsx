"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { CheckCircle, User, Mail, Phone, MessageCircle, ExternalLink } from "lucide-react"
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

export function OnboardingForm({ token }: { token: string }) {
  const router = useRouter()

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
    void fetchLink()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per token
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
    } catch (error: unknown) {
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

    if (!formData.first_name || !formData.email || !formData.telegram_chat_id) {
      toast({
        title: "Required Fields",
        description: "First name, email, and Telegram Chat ID are required",
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
        description: data.message || `Contact ${data.action} successfully`,
      })
    } catch (error: unknown) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit form",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getTelegramChatId = async () => {
    try {
      const botUsername = "userinfobot"
      window.open(`https://t.me/${botUsername}`, "_blank")

      setShowTelegramHelp(true)
    } catch (error) {
      console.error("Error opening Telegram:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-border bg-card/90 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-600 dark:text-emerald-400" />
            <h1 className="mb-2 text-2xl font-bold text-foreground">Success!</h1>
            <p className="mb-6 text-muted-foreground">
              You have been successfully added to the contact list with your Telegram ID. You will now receive event
              invitations and updates via both email and Telegram.
            </p>
            <Button onClick={() => window.close()} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-2xl px-4">
        <Card className="border-border bg-card/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="mb-2 text-3xl font-bold text-foreground">{link?.title || "Join Contact List"}</CardTitle>
            <p className="text-lg text-muted-foreground">
              {link?.description || "Add yourself to receive event invitations and updates"}
            </p>

            <div className="mt-4 rounded-lg border border-primary/35 bg-primary/10 p-4">
              <p className="text-sm text-foreground">
                {link?.current_uses || 0} of {link?.max_uses || 100} people have joined
                {link?.expires_at && (
                  <span className="mt-1 block text-muted-foreground">
                    Expires: {new Date(link.expires_at).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="flex items-center text-lg font-semibold text-foreground">
                  <User className="mr-2 h-5 w-5" />
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

              <div className="space-y-4">
                <h3 className="flex items-center text-lg font-semibold text-foreground">
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
                  <Label htmlFor="telegram_chat_id" className="flex flex-wrap items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Telegram Chat ID *
                    <Button type="button" variant="outline" size="sm" onClick={getTelegramChatId} className="h-6 px-2 text-xs">
                      Get ID
                    </Button>
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id="telegram_chat_id"
                      value={formData.telegram_chat_id}
                      onChange={(e) => handleInputChange("telegram_chat_id", e.target.value)}
                      placeholder="Enter your Telegram Chat ID"
                      required
                    />
                    <Button type="button" variant="outline" onClick={() => setShowTelegramHelp(true)} className="px-3">
                      Help
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">This allows us to send you Telegram messages for events</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Additional Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Any additional information you would like to share..."
                    rows={3}
                  />
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="h-12 w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
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

      <Dialog open={showTelegramHelp} onOpenChange={setShowTelegramHelp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <MessageCircle className="mr-2 h-5 w-5" />
              How to Get Your Telegram Chat ID
            </DialogTitle>
            <DialogDescription>Follow these steps to get your Telegram Chat ID:</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Step 1: Start a Chat</h4>
              <p className="text-sm text-muted-foreground">Click the button below to open a chat with @userinfobot:</p>
              <Button onClick={() => window.open("https://t.me/userinfobot", "_blank")} className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open @userinfobot
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Step 2: Send a Message</h4>
              <p className="text-sm text-muted-foreground">Send any message to the bot (like hello or /start)</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Step 3: Get Your Chat ID</h4>
              <p className="text-sm text-muted-foreground">
                The bot will reply with your Chat ID (a number like 123456789). Copy that number and paste it in the form
                above.
              </p>
            </div>

            <div className="rounded-lg border border-primary/35 bg-primary/10 p-3">
              <p className="text-sm text-foreground">
                <strong>Tip:</strong> Your Chat ID is a number like 123456789. It is unique to your Telegram account and works
                for any bot or service.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
