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
  const { user } = useSupabase()
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
      const res = await fetch("/api/user/wallet", { credentials: "include" })
      if (res.status === 401) {
        router.push("/login")
        return
      }
      if (!res.ok) {
        console.error("Error fetching wallet")
        return
      }
      const data = await res.json()
      setUserBalance(typeof data.balance === "number" ? data.balance : 0)

      const subscriptionData = data.subscription as Record<string, unknown> | null
      if (subscriptionData && typeof subscriptionData.tier === "string") {
        setUserTier(subscriptionData.tier)
        setTotalTokensPurchased(Number(subscriptionData.total_tokens_purchased) || 0)
        setCurrentSubscription(subscriptionData)
      } else {
        const createdAtStr = data.accountCreatedAt as string | null
        if (createdAtStr) {
          const createdAt = new Date(createdAtStr)
          const now = new Date()
          const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
          setUserTier(daysSinceCreation <= 30 ? "free" : "free")
        } else {
          setUserTier("free")
        }
        setTotalTokensPurchased(0)
        setCurrentSubscription(null)
      }

      setTransactions(Array.isArray(data.transactions) ? data.transactions : [])
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/user/wallet", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      setTransactions(Array.isArray(data.transactions) ? data.transactions : [])
    } catch (error) {
      console.error("Error fetching transactions:", error)
    }
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
    <div className="min-h-screen bg-gradient-to-b from-background via-card/20 to-background">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="grid gap-4 sm:gap-8 grid-cols-1 md:grid-cols-2">
          {/* Balance Card */}
          <Card className="border border-border/80 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                Your Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">
                  {userBalance} tokens
                </p>
                <p className="text-muted-foreground mt-2">
                  Each email costs 1 token
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Tier Card */}
          <Card className="border border-border/80 bg-card">
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
                  <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                    You're saving on tokens!
                  </p>
                )}
                {userTier === "free" && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-foreground">Choose your upgrade path:</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Button
                        className="w-full bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-500"
                        onClick={() => handleUpgradeToBasic()}
                      >
                        Basic Plan
                      </Button>
                      <Button
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
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
            <Card className="mt-6 border border-primary/35 bg-primary/10 sm:mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Upgrade Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        Upgrade to {upgradeRec.nextTier ? upgradeRec.nextTier.charAt(0).toUpperCase() + upgradeRec.nextTier.slice(1) : 'Unknown'}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatProrationInfo(upgradeRec.planChangeInfo.prorationInfo)}
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        +{upgradeRec.planChangeInfo.prorationInfo.proratedTokens} tokens for remaining period
                      </p>
                    </div>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => router.push('/pricing')}>
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })()}

        {/* Recent Transactions */}
        <Card className="mt-6 border border-border/80 bg-card sm:mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
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
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 p-4"
                  >
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
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
          <Card className={`border border-border/80 bg-card ${userTier === "free" ? "opacity-60" : ""}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
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
                    <Crown className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                    <h3 className="mb-2 text-xl font-semibold text-foreground">
                      Subscribe to Purchase Tokens
                    </h3>
                    <p className="mx-auto mb-6 max-w-md text-muted-foreground">
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
                          className="relative border border-border bg-muted/50 opacity-75"
                        >
                          {pack.popular && (
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                              <span className="rounded-full bg-muted-foreground px-2 py-1 text-xs text-background">
                                Popular
                              </span>
                            </div>
                          )}
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <h3 className="mb-1 text-lg font-bold text-foreground">{pack.name}</h3>
                              <p className="mb-1 text-2xl font-bold text-muted-foreground">{pack.tokens}</p>
                              <p className="mb-2 text-sm text-muted-foreground">tokens</p>
                              <p className="mb-3 text-sm text-muted-foreground">{pack.description}</p>
                              
                              <div className="mb-3">
                                <p className="text-xl font-bold text-foreground">
                                  RM{price.toFixed(2)}
                                </p>
                                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                  Save RM{savings.toFixed(2)}
                                </p>
                              </div>
                              
                              <Button className="w-full cursor-not-allowed bg-muted text-muted-foreground" disabled={true}>
                                Subscribe to Unlock
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                  
                  <div className="mt-8 rounded-lg border border-primary/35 bg-primary/10 p-6">
                    <h3 className="mb-3 font-semibold text-foreground">Ready to Get Started?</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Choose a subscription plan and unlock discounted token pricing. Save up to 30% on every purchase.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => router.push('/pricing')}>
                        View Subscription Plans
                      </Button>
                      <Button variant="outline" className="border-primary text-primary hover:bg-primary/10" onClick={() => router.push('/dashboard')}>
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
                        className={`relative border border-border/80 bg-card transition-shadow hover:shadow-lg ${
                          pack.popular ? "border-2 border-primary" : ""
                        }`}
                      >
                        {pack.popular && (
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                            <span className="rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
                              Popular
                            </span>
                          </div>
                        )}
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <h3 className="font-bold text-lg mb-1">{pack.name}</h3>
                            <p className="mb-1 text-2xl font-bold text-primary">{pack.tokens}</p>
                            <p className="text-muted-foreground text-sm mb-2">tokens</p>
                            <p className="mb-3 text-sm text-muted-foreground">{pack.description}</p>
                            
                            <div className="mb-3">
                              <p className="text-xl font-bold text-foreground">
                                RM{price.toFixed(2)}
                              </p>
                              {savings > 0 && (
                                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                  Save RM{savings.toFixed(2)}
                                </p>
                              )}
                            </div>
                            
                            <Button
                              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
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
        <DialogContent className="sm:max-w-md border-border bg-popover text-popover-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              {selectedPackage ? `Purchase ${selectedPackage.name}` : 'Payment'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedPackage && (
              <div className="mb-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  RM {selectedPackage.price.toFixed(2)}
                </p>
                <p className="text-muted-foreground">{selectedPackage.tokens} tokens</p>
                <p className="text-sm text-muted-foreground">at RM{currentTokenPrice.toFixed(2)} per token</p>
              </div>
            )}
            <form id="payment-form" className="space-y-4">
              <div id="payment-element" className="mb-4">
                {/* Stripe Elements will be mounted here */}
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
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