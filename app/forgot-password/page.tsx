"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sunrise, Mail, ArrowLeft } from "lucide-react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { toast } from "@/components/ui/use-toast"

export default function ForgotPasswordPage() {
  const { supabase } = useSupabase()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      setEmailSent(true)
      toast({
        title: "Reset Email Sent",
        description: "Check your email for a password reset link.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-green-100 rounded-full p-3">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <p className="text-gray-600">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-500">
              Click the link in your email to reset your password. The link will expire in 1 hour.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => setEmailSent(false)}
                variant="outline"
                className="w-full"
              >
                Send Another Email
              </Button>
              <Link href="/login">
                <Button variant="ghost" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Forgot Password?</h1>
            <p className="text-xl text-gray-600">No worries! We'll send you reset instructions.</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-orange-100 rounded-full p-2">
                <Mail className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Secure Reset</h3>
                <p className="text-gray-600">We'll send you a secure link to reset your password</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-rose-100 rounded-full p-2">
                <ArrowLeft className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Quick & Easy</h3>
                <p className="text-gray-600">Get back to creating amazing events in no time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Forgot Password Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <p className="text-gray-600">Enter your email to receive reset instructions</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-orange-500 hover:underline font-semibold">
                ← Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 