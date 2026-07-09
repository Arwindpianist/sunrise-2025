"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sunrise, Mail, ArrowLeft } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useBrand } from "@repo/ui/brand-provider"

export default function ForgotPasswordPage() {
  const brand = useBrand()
  const isSunset = brand === "sunset"
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const showUpgradeNotice = process.env.NEXT_PUBLIC_SHOW_UPGRADE_NOTICE !== "false"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const payload = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: payload?.error || "Failed to send reset email",
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
      <div className={isSunset ? "sunset-marketing min-h-screen bg-background flex items-center justify-center p-4" : "min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 flex items-center justify-center p-4"}>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-green-100 rounded-full p-3">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <p className={isSunset ? "text-muted-foreground" : "text-gray-600"}>
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className={isSunset ? "text-sm text-muted-foreground" : "text-sm text-gray-500"}>
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
    <div className={isSunset ? "sunset-marketing min-h-screen bg-background flex items-center justify-center p-4" : "min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 flex items-center justify-center p-4"}>
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Benefits */}
        <div className="hidden lg:block space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start space-x-2 mb-6">
              <Sunrise className={isSunset ? "h-10 w-10 text-primary" : "h-10 w-10 text-orange-500"} />
              <span className={isSunset ? "sunset-wordmark text-3xl font-bold bg-clip-text text-transparent" : "text-3xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent"}>
                {isSunset ? "Sunset-2025" : "Sunrise-2025"}
              </span>
            </div>
            <h1 className={isSunset ? "text-4xl font-bold text-foreground mb-4" : "text-4xl font-bold text-gray-800 mb-4"}>Forgot Password?</h1>
            <p className={isSunset ? "text-xl text-muted-foreground" : "text-xl text-gray-600"}>No worries. We'll send reset instructions.</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className={isSunset ? "bg-primary/15 rounded-full p-2" : "bg-orange-100 rounded-full p-2"}>
                <Mail className={isSunset ? "h-5 w-5 text-primary" : "h-5 w-5 text-orange-500"} />
              </div>
              <div>
                <h3 className={isSunset ? "font-semibold text-foreground" : "font-semibold text-gray-800"}>Secure Reset</h3>
                <p className={isSunset ? "text-muted-foreground" : "text-gray-600"}>We'll send you a secure link to reset your password.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className={isSunset ? "bg-primary/15 rounded-full p-2" : "bg-rose-100 rounded-full p-2"}>
                <ArrowLeft className={isSunset ? "h-5 w-5 text-primary" : "h-5 w-5 text-rose-500"} />
              </div>
              <div>
                <h3 className={isSunset ? "font-semibold text-foreground" : "font-semibold text-gray-800"}>Quick & Easy</h3>
                <p className={isSunset ? "text-muted-foreground" : "text-gray-600"}>Get back to your dashboard in no time.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Forgot Password Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <p className={isSunset ? "text-muted-foreground" : "text-gray-600"}>Enter your email to receive reset instructions</p>
            {showUpgradeNotice && (
              <div className={isSunset ? "rounded-md border border-primary/35 bg-primary/12 p-3 text-left text-sm text-foreground" : "rounded-md border border-amber-300 bg-amber-50 p-3 text-left text-sm text-amber-900"}>
                During our upgrade period, existing users should reset their password before signing in.
              </div>
            )}
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
                className={isSunset ? "w-full bg-primary text-primary-foreground hover:bg-primary/90" : "w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"}
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className={isSunset ? "text-primary hover:underline font-semibold" : "text-orange-500 hover:underline font-semibold"}>
                ← Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 