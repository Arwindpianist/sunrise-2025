"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Copy, Share2, Users, Gift, CheckCircle, ArrowLeft, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function ReferralsPage() {
  const router = useRouter()
  const { user, supabase } = useSupabase()
  const [mounted, setMounted] = useState(false)
  const [referralLink, setReferralLink] = useState("")
  const [isLoading, setIsLoading] = useState(true)

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
    }
  }, [user, router])

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
          title: 'Join Sunrise - Event Management Made Easy',
          text: 'I\'m using Sunrise to manage my events and send beautiful invitations. Join me and get started for free!',
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            Refer Friends & Earn Tokens
          </h1>
          <p className="text-muted-foreground text-lg">
            Share Sunrise with friends and earn 10 tokens for each successful referral!
          </p>
        </div>

        {/* Referral Link Section */}
        <Card className="bg-white/50 backdrop-blur-sm border-none shadow-lg mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Share this link with friends. When they sign up using your link, you'll earn 10 tokens!
              </p>
              <div className="flex gap-2">
                <Input 
                  value={referralLink} 
                  readOnly 
                  className="flex-1"
                  placeholder="Generating referral link..."
                />
                <Button onClick={copyReferralLink} variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button onClick={shareReferralLink} variant="outline" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <Card className="bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Referrals</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">0</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">0</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tokens Earned</p>
                  <p className="text-2xl font-bold text-purple-600">0</p>
                </div>
                <Gift className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referrals List */}
        <Card className="bg-white/50 backdrop-blur-sm border-none shadow-lg">
          <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No referrals yet</h3>
              <p className="text-muted-foreground mb-4">
                Share your referral link with friends to start earning tokens!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 