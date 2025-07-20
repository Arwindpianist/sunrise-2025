"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sunrise, Mail, Lock, CheckCircle, AlertCircle } from "lucide-react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { toast } from "@/components/ui/use-toast"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase, user } = useSupabase()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const redirectTo = searchParams.get('redirectedFrom') || '/dashboard'
        router.replace(redirectTo)
      }
    }
    checkSession()

    // Handle URL parameters for success/error messages
    const error = searchParams.get('error')
    const success = searchParams.get('success')
    const message = searchParams.get('message')

    if (success === 'email_verified') {
      toast({
        title: "Email Verified!",
        description: "Your email has been successfully verified. You can now sign in to your account.",
      })
    } else if (message === 'check_email') {
      toast({
        title: "Check Your Email!",
        description: "We've sent you a confirmation email. Please check your inbox and click the confirmation link before signing in.",
      })
    } else if (error) {
      toast({
        title: "Authentication Error",
        description: message || "An error occurred during authentication. Please try again.",
        variant: "destructive",
      })
    }
  }, [supabase, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      if (data.session) {
        const redirectTo = searchParams.get('redirectedFrom') || '/dashboard'
        router.replace(redirectTo)
      }
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
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome Back!</h1>
            <p className="text-xl text-gray-600">Continue creating beautiful moments and joyful celebrations.</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-orange-100 rounded-full p-2">
                <Mail className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Multi-Channel Messaging</h3>
                <p className="text-gray-600">Send invitations via email, WhatsApp, Telegram, and SMS</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-rose-100 rounded-full p-2">
                <Lock className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Secure & Reliable</h3>
                <p className="text-gray-600">Your events and contacts are safe with enterprise-grade security</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
            <p className="text-gray-600">Enter your credentials to access your account</p>
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

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <Link href="/forgot-password" className="text-sm text-orange-500 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{" "}
                <Link href="/register" className="text-orange-500 hover:underline font-semibold">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
