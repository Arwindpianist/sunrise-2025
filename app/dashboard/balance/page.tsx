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
        .select('tier, status')
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

  const handlePurchase = async (pack: typeof TOKEN_TOPUPS[0]) => {
    try {
      setIsLoading(true)
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

      const { data, error } = await supabase.functions.invoke<PaymentResponse>('create-payment', {
        body: {
          amount: pack.tokens.toString(),
          type: 'credits',
          userTier: userTier,
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
                  <Button 
                    className="mt-3 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                    onClick={() => router.push('/pricing')}
                  >
                    Upgrade to Save
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Status */}
        <div className="mt-6 sm:mt-8">
          <SubscriptionStatus />
        </div>

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
          <Card className="bg-white/50 backdrop-blur-sm">
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
              
              {/* Upgrade CTA for free users */}
              {userTier === "free" && (
                <div className="mt-6 p-4 bg-gradient-to-r from-orange-100 to-rose-100 rounded-lg text-center">
                  <h3 className="font-semibold text-gray-800 mb-2">Upgrade to Save More!</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Subscribe to a plan and get discounted token prices. Save up to 30% on every purchase.
                  </p>
                  <Button 
                    variant="outline"
                    className="border-orange-500 text-orange-500 hover:bg-orange-50"
                    onClick={() => router.push('/pricing')}
                  >
                    View Plans
                  </Button>
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