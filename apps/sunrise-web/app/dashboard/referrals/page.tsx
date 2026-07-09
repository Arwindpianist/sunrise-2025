"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Copy, Share2, Users, Gift, CheckCircle, ArrowLeft, TrendingUp, Eye } from "lucide-react"
import Link from "next/link"
import { useBrand } from "@repo/ui/brand-provider"

export default function ReferralsPage() {
  const brand = useBrand()
  const appName = brand === "sunset" ? "Sunset" : "Sunrise"
  const router = useRouter()
  const { user } = useSupabase()
  const [mounted, setMounted] = useState(false)
  const [referralLink, setReferralLink] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [referralStats, setReferralStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    tokensEarned: 0
  })
  const [referrals, setReferrals] = useState<any[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (user) {
      generateReferralLink()
      fetchReferralData()
    }
  }, [user, router])

  const fetchReferralData = async () => {
    if (!user) return
    
    try {
      const res = await fetch("/api/referrals", { credentials: "include" })
      if (res.status === 401) {
        router.push("/login")
        return
      }
      if (!res.ok) {
        console.error("Error fetching referrals:", await res.text())
        return
      }
      const payload = await res.json()
      const referrals = (payload.referrals || []) as any[]

      const stats = {
        total: referrals.length,
        completed: referrals.filter((r) => r.status === "completed").length,
        pending: referrals.filter((r) => r.status === "pending").length,
        tokensEarned: referrals.reduce((sum, r) => sum + (r.tokens_awarded || 0), 0),
      }

      setReferralStats(stats)
      setReferrals(referrals)
    } catch (error) {
      console.error('Error fetching referral data:', error)
    }
  }

  const generateReferralLink = () => {
    if (!user) return
    const baseUrl = window.location.origin
    const link = `${baseUrl}/register?ref=${user.id}`
    setReferralLink(link)
    setIsLoading(false)
  }

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      })
    }
  }

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${appName}`,
          text: `I'm using ${appName} to manage my events and send beautiful invitations. Join me and get started for free!`,
          url: referralLink,
        })
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          toast({
            title: "Error",
            description: "Failed to share link",
            variant: "destructive",
          })
        }
      }
    } else {
      copyReferralLink()
    }
  }

  if (!mounted) return null

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-card/20 to-background">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground transition-colors hover:text-primary sm:w-auto">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <Card className="border border-border/80 bg-card shadow-lg">
            <CardContent className="pt-6 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                    Refer Friends & Earn Tokens 🌟
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {`Share ${appName} with friends and earn `}
                    <span className="font-semibold text-primary">10 tokens</span> for each successful referral!
                  </p>
                </div>
                <div className="flex sm:hidden items-center justify-center mb-4">
                  <Gift className="h-8 w-8 text-primary" />
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <Gift className="h-8 w-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link Section */}
        <Card className="mb-6 border border-border/80 bg-card shadow-lg sm:mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Share2 className="h-5 w-5 text-primary" />
              Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Share this link with friends. When they sign up using your link, you'll earn{" "}
                <span className="font-semibold text-primary">10 tokens</span>!
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input 
                  value={referralLink} 
                  readOnly 
                  className="flex-1 border-border focus:border-primary focus:ring-primary"
                  placeholder="Generating referral link..."
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={copyReferralLink} 
                    variant="outline" 
                    size="sm"
                    className="flex-1 sm:flex-none border-border hover:border-primary hover:text-primary transition-colors"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    <span className="sm:hidden">Copy</span>
                  </Button>
                  <Button 
                    onClick={shareReferralLink} 
                    variant="outline" 
                    size="sm"
                    className="flex-1 sm:flex-none border-border hover:border-primary hover:text-primary transition-colors"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    <span className="sm:hidden">Share</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <Card className="cursor-pointer border border-border/80 bg-card transition-shadow duration-200 hover:border-primary/25 hover:shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-primary" />
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                {referralStats.total}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Total Referrals</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer border border-border/80 bg-card transition-shadow duration-200 hover:border-primary/25 hover:shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                {referralStats.completed}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Completed</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer border border-border/80 bg-card transition-shadow duration-200 hover:border-primary/25 hover:shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                {referralStats.pending}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Pending</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer border border-border/80 bg-card transition-shadow duration-200 hover:border-primary/25 hover:shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <Gift className="h-5 w-5 text-purple-500" />
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-primary sm:text-3xl">
                {referralStats.tokensEarned}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Tokens Earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Referrals List */}
        <Card className="border border-border/80 bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Your Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">No referrals yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Share your referral link with friends to start earning tokens! Every successful referral earns you 10 tokens.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={copyReferralLink}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button 
                    onClick={shareReferralLink}
                    variant="outline"
                    className="w-full border-primary/40 text-primary hover:border-primary hover:bg-primary/10 sm:w-auto"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {referrals.map((referral: any) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-4"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`h-3 w-3 rounded-full ${referral.status === "completed" ? "bg-emerald-500" : "bg-primary"}`}
                      ></div>
                      <div>
                        <p className="font-medium text-foreground">{referral.referred_email}</p>
                        <p className="text-sm text-muted-foreground">
                          {referral.status === 'completed' ? 'Completed' : 'Pending'} • {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {referral.tokens_awarded || 0} tokens
                      </p>
                      <Badge variant={referral.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {referral.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How It Works Section */}
        <Card className="mt-6 border border-border/80 bg-card shadow-lg sm:mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CheckCircle className="h-5 w-5 text-green-500" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                  <span className="text-primary font-bold text-lg">1</span>
                </div>
                <h4 className="mb-2 font-semibold text-foreground">Share Your Link</h4>
                <p className="text-sm text-muted-foreground">
                  Copy and share your unique referral link with friends and family
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                  <span className="text-primary font-bold text-lg">2</span>
                </div>
                <h4 className="mb-2 font-semibold text-foreground">They Sign Up</h4>
                <p className="text-sm text-muted-foreground">
                  When they use your link to create an account, we track the referral
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                  <span className="text-primary font-bold text-lg">3</span>
                </div>
                <h4 className="mb-2 font-semibold text-foreground">Earn Tokens</h4>
                <p className="text-sm text-muted-foreground">
                  Once they complete their account setup, you earn 10 tokens instantly
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 