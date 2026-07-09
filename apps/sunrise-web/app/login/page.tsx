"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sunrise, Mail, Lock, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useBrand } from "@repo/ui/brand-provider"

function LoginForm() {
  const brand = useBrand()
  const isSunset = brand === "sunset"
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const showUpgradeNotice = process.env.NEXT_PUBLIC_SHOW_UPGRADE_NOTICE !== "false"

  useEffect(() => {
    const checkSession = async () => {
      if (status === "loading") return
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
  }, [status, session, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        toast({
          title: "Error",
          description: "Invalid credentials",
          variant: "destructive",
        })
        return
      }
      if (result?.ok) {
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
            <h1 className="mb-4 text-4xl font-bold text-foreground">Welcome Back!</h1>
            <p className="text-xl text-muted-foreground">
              {isSunset ? "Continue coordinating thoughtful memorial communication." : "Continue creating beautiful moments and joyful celebrations."}
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className={isSunset ? "bg-primary/15 rounded-full p-2" : "bg-orange-100 rounded-full p-2"}>
                <Mail className={isSunset ? "h-5 w-5 text-primary" : "h-5 w-5 text-orange-500"} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Multi-Channel Messaging</h3>
                <p className="text-muted-foreground">Send updates via email and supported messaging channels.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className={isSunset ? "bg-primary/15 rounded-full p-2" : "bg-rose-100 rounded-full p-2"}>
                <Lock className={isSunset ? "h-5 w-5 text-primary" : "h-5 w-5 text-rose-500"} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Secure & Reliable</h3>
                <p className="text-muted-foreground">Your account and contacts are protected with enterprise-grade security.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
            <p className="text-muted-foreground">Enter your credentials to access your account</p>
            {showUpgradeNotice && (
              <div className={isSunset ? "mt-3 rounded-md border border-primary/35 bg-primary/12 p-3 text-left text-sm text-foreground" : "mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-left text-sm text-amber-900"}>
                Platform upgrades are in progress. If your previous password fails, please{" "}
                <Link href="/forgot-password" className="font-semibold underline">
                  reset your password
                </Link>
                .
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

              <PasswordInput
                id="password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="flex items-center justify-between">
                <Link href="/forgot-password" className={isSunset ? "text-sm text-primary hover:underline" : "text-sm text-orange-500 hover:underline"}>
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className={isSunset ? "w-full bg-primary text-primary-foreground hover:bg-primary/90" : "w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"}
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className={isSunset ? "text-primary hover:underline font-semibold" : "text-orange-500 hover:underline font-semibold"}>
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
