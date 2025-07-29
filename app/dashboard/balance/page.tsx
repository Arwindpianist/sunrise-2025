"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { loadStripe } from '@stripe/stripe-js'
import { Coins, TrendingUp, Clock, CheckCircle, Crown, Zap, Building } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TOKEN_TOPUPS, getTokenPrice, calculateTokenPackPrice, getTierInfo } from "@/lib/pricing"
import SubscriptionStatus from "@/components/subscription-status"
import { canBuyTokens, getRemainingTokenAllowance } from "@/lib/subscription"
import { getPlanChangeInfo, isPlanUpgrade, formatProrationInfo } from "@/lib/billing-utils"
import { TokenLimitInfo, TokenLimitWarning } from "@/components/token-limit-warning"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

function getTierIcon(tier: string) {
  switch (tier) {
    case "enterprise": return Crown;
    case "pro": return Zap;
    case "basic": return Building;
    default: return Coins;
  }
}

interface PaymentResponse {
  clientSecret: string;
  amount: number;
  credits: number;
}

export default function BalancePage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<{tokens: number, price: number, name: string} | null>(null)
  const [userBalance, setUserBalance] = useState(0)
  const [userTier, setUserTier] = useState<string>("free")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalTokensPurchased, setTotalTokensPurchased] = useState(0)
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      fetchUserData()
      fetchTransactions()
      
      // Check for payment intent in URL
      const urlParams = new URLSearchParams(window.location.search)
      const paymentIntent = urlParams.get('payment_intent')
      if (paymentIntent) {
        handlePaymentIntent(paymentIntent)
      }
      
      // Check for subscription success
      const success = urlParams.get('success')
      const sessionId = urlParams.get('session_id')
      if (success === 'true' && sessionId) {
        handleSubscriptionSuccess(sessionId)
      }

      // Set up auto-refresh every 30 seconds to keep balance updated
      const refreshInterval = setInterval(refreshUserData, 30000)
      
      return () => clearInterval(refreshInterval)
    }
  }, [user, router])

  const fetchUserData = async () => {
    try {
      // Fetch user balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', user?.id)
        .single()

      if (balanceError && balanceError.code !== 'PGRST116') throw balanceError
      setUserBalance(balanceData?.balance || 0)

      // Fetch user subscription tier - check for any subscription first
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('tier, status, total_tokens_purchased, current_period_start, current_period_end')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subscriptionError)
      }
      
      // Use the subscription tier if it exists, otherwise check for trial
      if (subscriptionData) {
        setUserTier(subscriptionData.tier)
        setTotalTokensPurchased(subscriptionData.total_tokens_purchased || 0)
        setCurrentSubscription(subscriptionData)
      } else {
        // Check if user is in trial period
        const { data: profile } = await supabase.auth.getUser()
        if (profile.user) {
          const createdAt = new Date(profile.user.created_at)
          const now = new Date()
          const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
          
          if (daysSinceCreation <= 30) {
            setUserTier("free") // Trial period
          } else {
            setUserTier("free") // No subscription
          }
        } else {
          setUserTier("free")
        }
        setTotalTokensPurchased(0)
        setCurrentSubscription(null)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchTransactions = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching transactions:', error)
      return
    }

    setTransactions(data || [])
  }

  const handleSubscriptionSuccess = async (sessionId: string) => {
    try {
      // Refresh user data to get updated subscription and balance
      await fetchUserData()
      await fetchTransactions()
      
      toast({
        title: "Subscription Successful!",
        description: "Your subscription has been activated and tokens have been credited to your account.",
        variant: "default",
      })
      
      // Clean up URL parameters
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      url.searchParams.delete('session_id')
      window.history.replaceState({}, '', url.toString())
    } catch (error) {
      console.error('Error handling subscription success:', error)
    }
  }

  const refreshUserData = async () => {
    await fetchUserData()
    await fetchTransactions()
  }

  const handleUpgradeToBasic = async () => {
    try {
      setIsLoading(true)
      
      // Create Stripe checkout session for Basic plan
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier: 'basic' }),
      })

      if (!response.ok) {
        throw new Error('Failed to create subscription')
      }

      const { url } = await response.json()
      
      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      toast({
        title: "Subscription Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentIntent = async (clientSecret: string) => {
    try {
      setIsLoading(true)
      
      // Load Stripe
      const stripe = await stripePromise
      if (!stripe) throw new Error("Stripe failed to load")

      // Create payment element
      const elements = stripe.elements({
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0F172A',
          },
        },
      })

      // Create and mount the Payment Element
      const paymentElement = elements.create('payment')
      
      // Show payment dialog
      setSelectedPackage({
        tokens: 0,
        price: 0,
        name: 'Subscription Payment'
      })
      setIsPaymentOpen(true)
      
      // Mount payment element when dialog opens
      setTimeout(() => {
        const paymentContainer = document.getElementById('payment-element')
        if (paymentContainer) {
          paymentElement.mount('#payment-element')
        }
      }, 100)
      
    } catch (error) {
      console.error('Error handling payment intent:', error)
      toast({
        title: "Payment Error",
        description: "Failed to load payment form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getUpgradeRecommendation = () => {
    if (!currentSubscription || userTier === 'enterprise') return null
    
    // Check if subscription dates are valid
    const startDate = new Date(currentSubscription.current_period_start)
    const endDate = new Date(currentSubscription.current_period_end)
    
    // If dates are invalid or the same, skip upgrade recommendation
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate.getTime() === endDate.getTime()) {
      return null
    }
    
    const nextTier = userTier === 'free' ? 'basic' : userTier === 'basic' ? 'pro' : 'enterprise'
    const planChangeInfo = getPlanChangeInfo(
      userTier as any,
      nextTier as any,
      currentSubscription.current_period_start,
      currentSubscription.current_period_end
    )
    
    return {
      nextTier,
      planChangeInfo,
      currentTier: userTier
    }
  }

  const handlePurchase = async (pack: typeof TOKEN_TOPUPS[0]) => {
    try {
      setIsLoading(true)

      // Check if user can buy tokens
      if (!canBuyTokens(userTier as any, totalTokensPurchased)) {
        const remaining = getRemainingTokenAllowance(userTier as any, totalTokensPurchased)
        toast({
          title: "Token Purchase Limit Reached",
          description: `You have reached your token purchase limit. You can only purchase ${remaining} more tokens with your current plan.`,
          variant: "destructive",
        })
        return
      }

      // Check if this purchase would exceed the limit
      const remaining = getRemainingTokenAllowance(userTier as any, totalTokensPurchased)
      if (pack.tokens > remaining) {
        toast({
          title: "Purchase Would Exceed Limit",
          description: `This purchase would exceed your token limit. You can only purchase ${remaining} more tokens.`,
          variant: "destructive",
        })
        return
      }

      const price = calculateTokenPackPrice(pack.tokens, userTier)
      setSelectedPackage({
        tokens: pack.tokens,
        price: price,
        name: pack.name
      })
      setIsPaymentOpen(true)

      // Create payment intent
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("No active session")

      // Map pack name to pack ID
      const packIdMap: Record<string, string> = {
        'Starter Pack': 'mini',
        'Popular Pack': 'plus', 
        'Business Pack': 'pro',
        'Enterprise Pack': 'business'
      }
      const packId = packIdMap[pack.name]

      const { data, error } = await supabase.functions.invoke<PaymentResponse>('create-payment', {
        body: {
          amount: pack.tokens.toString(),
          type: 'credits',
          userTier: userTier,
          packId: packId,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (error) throw error
      if (!data?.clientSecret) throw new Error("No client secret received")

      // Load Stripe
      const stripe = await stripePromise
      if (!stripe) throw new Error("Stripe failed to load")

      // Create payment element
      const elements = stripe.elements({
        clientSecret: data.clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0F172A',
          },
        },
      })

      // Create and mount the Payment Element
      const paymentElement = elements.create('payment')
      paymentElement.mount('#payment-element')

      // Handle form submission
      const form = document.getElementById('payment-form')
      if (!form) throw new Error("Payment form not found")

      form.addEventListener('submit', async (event) => {
        event.preventDefault()

        const { error: submitError } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/dashboard/balance?success=true`,
          },
        })

        if (submitError) {
          const messageDiv = document.getElementById('payment-message')
          if (messageDiv) {
            messageDiv.textContent = submitError.message ?? ''
          }
        }
      })

    } catch (error: any) {
      console.error("Payment error:", error)
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      })
      setIsPaymentOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return null
  }

  const currentTokenPrice = getTokenPrice(userTier)
  const TierIcon = getTierIcon(userTier)
  const tierInfo = getTierInfo(userTier)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="grid gap-4 sm:gap-8 grid-cols-1 md:grid-cols-2">
          {/* Balance Card */}
          <Card className="bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-orange-500" />
                Your Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                  {userBalance} tokens
                </p>
                <p className="text-muted-foreground mt-2">
                  Each email costs 1 token
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Tier Card */}
          <Card className="bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TierIcon className={`h-5 w-5 ${tierInfo.color}`} />
                Your Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className={`text-2xl font-bold ${tierInfo.color} capitalize`}>
                  {userTier === "free" ? "No Plan" : userTier}
                </p>
                <p className="text-muted-foreground mt-2">
                  Token Price: RM{currentTokenPrice.toFixed(2)}
                </p>
                {userTier !== "free" && (
                  <p className="text-sm text-green-600 mt-1">
                    You're saving on tokens!
                  </p>
                )}
                {userTier === "free" && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Choose your upgrade path:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                        onClick={() => handleUpgradeToBasic()}
                      >
                        Basic Plan
                      </Button>
                      <Button 
                        className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                        onClick={() => router.push('/pricing')}
                      >
                        View All Plans
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Token Limit Progress */}
        <div className="mt-6 sm:mt-8">
          <TokenLimitInfo 
            tier={userTier as any} 
            currentBalance={userBalance} 
            totalTokensPurchased={totalTokensPurchased}
          />
        </div>

        {/* Token Limit Warning */}
        <div className="mt-6 sm:mt-8">
          <TokenLimitWarning 
            tier={userTier as any} 
            currentBalance={userBalance} 
            totalTokensPurchased={totalTokensPurchased}
            onUpgrade={() => router.push('/pricing')}
          />
        </div>

        {/* Subscription Status */}
        <div className="mt-6 sm:mt-8">
          <SubscriptionStatus />
        </div>

        {/* Upgrade Recommendation */}
        {(() => {
          const upgradeRec = getUpgradeRecommendation()
          if (!upgradeRec) return null
          
          return (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mt-6 sm:mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <TrendingUp className="h-5 w-5" />
                  Upgrade Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900">
                        Upgrade to {upgradeRec.nextTier.charAt(0).toUpperCase() + upgradeRec.nextTier.slice(1)}
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        {formatProrationInfo(upgradeRec.planChangeInfo.prorationInfo)}
                      </p>
                      <p className="text-sm font-medium text-blue-800 mt-2">
                        +{upgradeRec.planChangeInfo.prorationInfo.proratedTokens} tokens for remaining period
                      </p>
                    </div>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => router.push('/pricing')}
                    >
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })()}

        {/* Recent Transactions */}
        <Card className="bg-white/50 backdrop-blur-sm mt-6 sm:mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <p className="text-muted-foreground text-center">No successful transactions yet.</p>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex justify-between items-center p-4 bg-white/50 rounded-lg backdrop-blur-sm"
                  >
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-bold flex items-center gap-1 text-green-600">
                      +{transaction.amount} tokens
                      <CheckCircle className="h-4 w-4" />
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Token Purchase Section */}
        <div className="mt-6 sm:mt-8">
          <Card className={`bg-white/50 backdrop-blur-sm ${userTier === "free" ? "opacity-60" : ""}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-orange-500" />
                Purchase Tokens
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Your current token price: RM{currentTokenPrice.toFixed(2)} per token
              </p>
            </CardHeader>
            <CardContent>
              {userTier === "free" ? (
                /* Subscription Required Message for Free Users */
                <div className="text-center py-8">
                  <div className="mb-4">
                    <Crown className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      Subscribe to Purchase Tokens
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Token purchases are available exclusively for subscribers. Upgrade to any plan to unlock discounted token pricing and start purchasing tokens.
                    </p>
                  </div>
                  
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-4xl mx-auto">
                    {TOKEN_TOPUPS.map((pack) => {
                      const price = calculateTokenPackPrice(pack.tokens, "basic") // Show basic tier pricing as example
                      const savings = (pack.tokens * 0.50) - price
                      
                      return (
                        <Card
                          key={pack.name}
                          className="relative bg-gray-50 border-gray-200 opacity-75"
                        >
                          {pack.popular && (
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                              <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                                Popular
                              </span>
                            </div>
                          )}
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <h3 className="font-bold text-lg mb-1 text-gray-600">{pack.name}</h3>
                              <p className="text-2xl font-bold text-gray-400 mb-1">{pack.tokens}</p>
                              <p className="text-muted-foreground text-sm mb-2">tokens</p>
                              <p className="text-sm text-gray-400 mb-3">{pack.description}</p>
                              
                              <div className="mb-3">
                                <p className="text-xl font-bold text-gray-500">
                                  RM{price.toFixed(2)}
                                </p>
                                <p className="text-sm text-green-600">
                                  Save RM{savings.toFixed(2)}
                                </p>
                              </div>
                              
                              <Button 
                                className="w-full bg-gray-400 text-white cursor-not-allowed"
                                disabled={true}
                              >
                                Subscribe to Unlock
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                  
                  <div className="mt-8 p-6 bg-gradient-to-r from-orange-100 to-rose-100 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-3">Ready to Get Started?</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Choose a subscription plan and unlock discounted token pricing. Save up to 30% on every purchase.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button 
                        className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                        onClick={() => router.push('/pricing')}
                      >
                        View Subscription Plans
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-orange-500 text-orange-500 hover:bg-orange-50"
                        onClick={() => router.push('/dashboard')}
                      >
                        Back to Dashboard
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Token Purchase Cards for Subscribed Users */
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                  {TOKEN_TOPUPS.map((pack) => {
                    const price = calculateTokenPackPrice(pack.tokens, userTier)
                    const savings = userTier !== "free" ? (pack.tokens * 0.50) - price : 0
                    
                    return (
                      <Card
                        key={pack.name}
                        className={`relative bg-white/50 backdrop-blur-sm hover:shadow-lg transition-shadow ${
                          pack.popular ? "border-2 border-orange-500" : ""
                        }`}
                      >
                        {pack.popular && (
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                              Popular
                            </span>
                          </div>
                        )}
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <h3 className="font-bold text-lg mb-1">{pack.name}</h3>
                            <p className="text-2xl font-bold text-orange-500 mb-1">{pack.tokens}</p>
                            <p className="text-muted-foreground text-sm mb-2">tokens</p>
                            <p className="text-sm text-gray-500 mb-3">{pack.description}</p>
                            
                            <div className="mb-3">
                              <p className="text-xl font-bold text-gray-800">
                                RM{price.toFixed(2)}
                              </p>
                              {savings > 0 && (
                                <p className="text-sm text-green-600">
                                  Save RM{savings.toFixed(2)}
                                </p>
                              )}
                            </div>
                            
                            <Button 
                              className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                              onClick={() => handlePurchase(pack)}
                              disabled={isLoading}
                            >
                              {isLoading ? "Processing..." : "Purchase Tokens"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-orange-500" />
              {selectedPackage ? `Purchase ${selectedPackage.name}` : 'Payment'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedPackage && (
              <div className="mb-4 text-center">
                <p className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                  RM {selectedPackage.price.toFixed(2)}
                </p>
                <p className="text-muted-foreground">{selectedPackage.tokens} tokens</p>
                <p className="text-sm text-gray-500">at RM{currentTokenPrice.toFixed(2)} per token</p>
              </div>
            )}
            <form id="payment-form" className="space-y-4">
              <div id="payment-element" className="mb-4">
                {/* Stripe Elements will be mounted here */}
              </div>
              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
              >
                {isLoading ? "Processing..." : "Pay Now"}
              </Button>
              <div id="payment-message" className="text-red-500 mt-2 text-center"></div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 