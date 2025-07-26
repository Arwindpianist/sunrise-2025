"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

    setIsLoading(true)

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        console.error('Auth error:', {
          message: authError.message,
          status: authError.status,
          name: authError.name
        })
        throw new Error(authError.message || 'Failed to create account')
      }

      if (!authData?.user) {
        throw new Error('No user data returned from signup')
      }

      console.log('User created:', {
        id: authData.user.id,
        email: authData.user.email,
        created_at: authData.user.created_at,
        email_confirmed: authData.user.email_confirmed_at
      })

      // Track referral if referrerId exists
      if (referrerId) {
        try {
          const response = await fetch('/api/referrals', {
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
            console.error('Failed to track referral')
          }
        } catch (error) {
          console.error('Error tracking referral:', error)
        }
      }

      // Always show email confirmation message for new registrations
      // Don't auto-login even if email appears confirmed
      toast({
        title: "Account Created!",
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

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  required
                />
              </div>

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
