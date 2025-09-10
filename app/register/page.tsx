"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sunrise, Calendar, Users, MessageSquare } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/providers/supabase-provider"

export default function RegisterPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    consentMarketing: false,
    consentAnalytics: false,
    consentThirdParty: false,
    consentDataProcessing: true, // Required for service provision
  })
  const [isLoading, setIsLoading] = useState(false)
  const [referrerId, setReferrerId] = useState<string | null>(null)

  // Check for referral parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const ref = urlParams.get('ref')
    if (ref) {
      setReferrerId(ref)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (!formData.agreeToTerms) {
      toast({
        title: "Error",
        description: "Please agree to the terms and conditions",
        variant: "destructive",
      })
      return
    }

    if (!formData.consentDataProcessing) {
      toast({
        title: "Error",
        description: "Data processing consent is required to provide our services",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Use server-side signup to bypass database trigger issues
      console.log('Attempting server-side signup for:', formData.email)
      
      const response = await fetch('/api/signup-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Server-side signup failed')
      }

      if (!result.success) {
        throw new Error(result.error || 'Server-side signup failed')
      }

      // Extract user data from server response
      const authData = { user: result.user }
      const authError = null // No error from server-side signup

      // Server-side signup handles all the complexity
      // No need for complex error handling here

      console.log('User created:', {
        id: authData.user.id,
        email: authData.user.email,
        created_at: authData.user.created_at,
        email_confirmed: authData.user.email_confirmed_at
      })

      // User record creation is handled by server-side signup API
      console.log('User record creation handled by server-side API')

      // Track referral if referrerId exists
      if (referrerId) {
        try {
          const response = await fetch('/api/referrals/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              referrerId: referrerId,
              email: formData.email
            }),
          })

          if (response.ok) {
            console.log('Referral tracked successfully')
          } else {
            const errorData = await response.json()
            console.error('Failed to track referral:', errorData)
          }
        } catch (error) {
          console.error('Error tracking referral:', error)
        }
      }

      // Show success message for server-side signup
      toast({
        title: "Account Created Successfully!",
        description: "Please check your email to confirm your account before logging in.",
      })
      
      // Redirect to a confirmation page or login with message
      router.push("/login?message=check_email")
    } catch (error: any) {
      console.error('Registration error:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
      
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Benefits */}
        <div className="hidden lg:block space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start space-x-2 mb-6">
              <Sunrise className="h-10 w-10 text-orange-500" />
              <span className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                Sunrise-2025
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Start Your Journey</h1>
            <p className="text-xl text-gray-600">Join thousands creating unforgettable celebrations.</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-orange-100 rounded-full p-2">
                <Calendar className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Easy Event Creation</h3>
                <p className="text-gray-600">Create beautiful events in minutes with our intuitive interface</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-rose-100 rounded-full p-2">
                <Users className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Smart Contact Management</h3>
                <p className="text-gray-600">Organize your guest lists and import contacts effortlessly</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-amber-100 rounded-full p-2">
                <MessageSquare className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Automated Reminders</h3>
                <p className="text-gray-600">Never miss sending invitations or follow-up messages</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Registration Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <p className="text-gray-600">Start your free account today</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Preferred Name/Username</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Your preferred name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              <PasswordInput
                id="password"
                label="Password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
                minLength={6}
              />

              <PasswordInput
                id="confirmPassword"
                label="Confirm Password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                required
              />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{" "}
                    <Link href="/terms" className="text-orange-500 hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-orange-500 hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-blue-800 text-sm">Data Processing Consent (PDPA Compliance)</h4>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dataProcessing"
                      checked={formData.consentDataProcessing}
                      onCheckedChange={(checked) => handleInputChange("consentDataProcessing", checked as boolean)}
                    />
                    <Label htmlFor="dataProcessing" className="text-sm text-blue-700">
                      <strong>Required:</strong> I consent to the processing of my personal data to provide Sunrise services
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="marketing"
                      checked={formData.consentMarketing}
                      onCheckedChange={(checked) => handleInputChange("consentMarketing", checked as boolean)}
                    />
                    <Label htmlFor="marketing" className="text-sm text-blue-700">
                      <strong>Optional:</strong> I consent to receive marketing communications and promotional emails
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="analytics"
                      checked={formData.consentAnalytics}
                      onCheckedChange={(checked) => handleInputChange("consentAnalytics", checked as boolean)}
                    />
                    <Label htmlFor="analytics" className="text-sm text-blue-700">
                      <strong>Optional:</strong> I consent to analytics and performance monitoring to improve services
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="thirdParty"
                      checked={formData.consentThirdParty}
                      onCheckedChange={(checked) => handleInputChange("consentThirdParty", checked as boolean)}
                    />
                    <Label htmlFor="thirdParty" className="text-sm text-blue-700">
                      <strong>Optional:</strong> I consent to data sharing with third-party service providers
                    </Label>
                  </div>

                  <p className="text-xs text-blue-600 mt-2">
                    You can change these consent settings anytime in your account settings. 
                    Learn more in our <Link href="/privacy" className="underline">Privacy Policy</Link>.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-orange-500 hover:underline font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
