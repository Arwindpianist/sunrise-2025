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

export default function ReferralsPage() {
  const router = useRouter()
  const { user, supabase } = useSupabase()
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
      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching referrals:', error)
        return
      }

      const stats = {
        total: referrals?.length || 0,
        completed: referrals?.filter(r => r.status === 'completed').length || 0,
        pending: referrals?.filter(r => r.status === 'pending').length || 0,
        tokensEarned: referrals?.reduce((sum, r) => sum + (r.tokens_awarded || 0), 0) || 0
      }

      setReferralStats(stats)
      setReferrals(referrals || [])
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
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="ghost" size="sm" className="w-full sm:w-auto text-gray-600 hover:text-orange-500 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <Card className="bg-white/50 backdrop-blur-sm border-none shadow-lg">
            <CardContent className="pt-6 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                    Refer Friends & Earn Tokens 🌟
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Share Sunrise with friends and earn <span className="font-semibold text-orange-600">10 tokens</span> for each successful referral!
                  </p>
                </div>
                <div className="flex sm:hidden items-center justify-center mb-4">
                  <Gift className="h-8 w-8 text-orange-500" />
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <Gift className="h-8 w-8 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link Section */}
        <Card className="bg-white/50 backdrop-blur-sm border-none shadow-lg mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Share2 className="h-5 w-5 text-orange-500" />
              Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Share this link with friends. When they sign up using your link, you'll earn <span className="font-semibold text-orange-600">10 tokens</span>!
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input 
                  value={referralLink} 
                  readOnly 
                  className="flex-1 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                  placeholder="Generating referral link..."
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={copyReferralLink} 
                    variant="outline" 
                    size="sm"
                    className="flex-1 sm:flex-none border-gray-200 hover:border-orange-500 hover:text-orange-600 transition-colors"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    <span className="sm:hidden">Copy</span>
                  </Button>
                  <Button 
                    onClick={shareReferralLink} 
                    variant="outline" 
                    size="sm"
                    className="flex-1 sm:flex-none border-gray-200 hover:border-orange-500 hover:text-orange-600 transition-colors"
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
          <Card className="bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-orange-500" />
                <Eye className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                {referralStats.total}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Referrals</p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <Eye className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                {referralStats.completed}
              </p>
              <p className="text-sm text-gray-600 mt-1">Completed</p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <Eye className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                {referralStats.pending}
              </p>
              <p className="text-sm text-gray-600 mt-1">Pending</p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <Gift className="h-5 w-5 text-purple-500" />
                <Eye className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                {referralStats.tokensEarned}
              </p>
              <p className="text-sm text-gray-600 mt-1">Tokens Earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Referrals List */}
        <Card className="bg-white/50 backdrop-blur-sm border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Users className="h-5 w-5 text-orange-500" />
              Your Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-r from-orange-100 to-rose-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <Users className="h-10 w-10 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No referrals yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Share your referral link with friends to start earning tokens! Every successful referral earns you 10 tokens.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={copyReferralLink}
                    className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button 
                    onClick={shareReferralLink}
                    variant="outline"
                    className="w-full sm:w-auto border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {referrals.map((referral: any) => (
                  <div key={referral.id} className="flex items-center justify-between p-4 bg-white/30 rounded-lg border border-white/50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${referral.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{referral.referred_email}</p>
                        <p className="text-sm text-gray-600">
                          {referral.status === 'completed' ? 'Completed' : 'Pending'} • {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
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
        <Card className="bg-white/50 backdrop-blur-sm border-none shadow-lg mt-6 sm:mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <CheckCircle className="h-5 w-5 text-green-500" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
              <div className="text-center">
                <div className="bg-gradient-to-r from-orange-100 to-rose-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 font-bold text-lg">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Share Your Link</h4>
                <p className="text-sm text-muted-foreground">
                  Copy and share your unique referral link with friends and family
                </p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-orange-100 to-rose-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 font-bold text-lg">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">They Sign Up</h4>
                <p className="text-sm text-muted-foreground">
                  When they use your link to create an account, we track the referral
                </p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-orange-100 to-rose-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 font-bold text-lg">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Earn Tokens</h4>
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