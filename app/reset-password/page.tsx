"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sunrise, Lock, CheckCircle } from "lucide-react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { toast } from "@/components/ui/use-toast"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase } = useSupabase()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [passwordReset, setPasswordReset] = useState(false)

  useEffect(() => {
    // Check if user is authenticated (they should be after clicking reset link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Invalid Reset Link",
          description: "This reset link is invalid or has expired. Please request a new one.",
          variant: "destructive",
        })
        router.push('/forgot-password')
      }
    }
    checkSession()

    // Show success message if redirected from email verification
    const success = searchParams.get('success')
    if (success === 'email_verified') {
      toast({
        title: "Email Verified!",
        description: "Your email has been verified. You can now set a new password.",
      })
    }
  }, [supabase, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      setPasswordReset(true)
      toast({
        title: "Password Updated!",
        description: "Your password has been successfully updated.",
      })

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
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

  if (passwordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-green-100 rounded-full p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Password Updated!</CardTitle>
            <p className="text-gray-600">
              Your password has been successfully reset.
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              Redirecting you to the dashboard...
            </p>
            <Link href="/dashboard">
              <Button className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600">
                Go to Dashboard
              </Button>
            </Link>
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
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Set New Password</h1>
            <p className="text-xl text-gray-600">Choose a strong password to secure your account.</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-orange-100 rounded-full p-2">
                <Lock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Secure Password</h3>
                <p className="text-gray-600">Use a strong password with at least 6 characters</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-rose-100 rounded-full p-2">
                <CheckCircle className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Quick Access</h3>
                <p className="text-gray-600">You'll be redirected to your dashboard after reset</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Reset Password Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">New Password</CardTitle>
            <p className="text-gray-600">Enter your new password below</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <PasswordInput
                id="password"
                label="New Password"
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />

              <PasswordInput
                id="confirmPassword"
                label="Confirm Password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update Password"}
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