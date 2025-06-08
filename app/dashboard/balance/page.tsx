"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { loadStripe } from '@stripe/stripe-js'
import { Coins, TrendingUp, Clock, CheckCircle } from "lucide-react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const CREDIT_PACKAGES = [
  { id: '100', credits: 100, price: 4.90, popular: false },
  { id: '500', credits: 500, price: 19.90, popular: true },
  { id: '1000', credits: 1000, price: 39.90, popular: false },
  { id: '5000', credits: 5000, price: 199.90, popular: false },
]

const PRICE_PER_EMAIL = 0.05 // RM 0.05 per email

export default function BalancePage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [userBalance, setUserBalance] = useState(0)
  const [transactions, setTransactions] = useState<any[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      fetchUserBalance()
      fetchTransactions()
    }
  }, [user, router])

  const fetchUserBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setUserBalance(data?.balance || 0)
    } catch (error) {
      console.error('Error fetching user balance:', error)
    }
  }

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const handlePurchase = async (packageId: string) => {
    try {
      setIsLoading(true)

      // Create payment intent
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("No active session")

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: packageId,
          type: 'credits',
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (error) throw error

      // Load Stripe
      const stripe = await stripePromise
      if (!stripe) throw new Error("Stripe failed to load")

      // Confirm payment
      const { error: stripeError } = await stripe.confirmPayment({
        elements: undefined,
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/balance?success=true`,
        },
        redirect: 'if_required'
      })

      if (stripeError) {
        if (stripeError.type === 'card_error' || stripeError.type === 'validation_error') {
          throw new Error(stripeError.message)
        } else {
          throw new Error('An unexpected error occurred.')
        }
      }

      // Check payment status
      const paymentIntent = await stripe.retrievePaymentIntent(data.clientSecret)
      
      if (paymentIntent.paymentIntent?.status === 'succeeded') {
        toast({
          title: "Success!",
          description: "Your payment was successful.",
        })
        router.refresh()
      } else if (paymentIntent.paymentIntent?.status === 'requires_payment_method') {
        // Payment failed or was cancelled
        throw new Error('Payment failed. Please try again.')
      } else if (paymentIntent.paymentIntent?.status === 'requires_confirmation') {
        // Payment needs confirmation
        const { error: confirmError } = await stripe.confirmPayment({
          elements: undefined,
          clientSecret: data.clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/dashboard/balance?success=true`,
          },
        })
        
        if (confirmError) {
          throw new Error(confirmError.message)
        }
      } else {
        // Handle other states
        throw new Error(`Payment status: ${paymentIntent.paymentIntent?.status}`)
      }

    } catch (error: any) {
      console.error("Payment error:", error)
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || !mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto py-8">
        <div className="grid gap-8 md:grid-cols-2">
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
                  RM{(userBalance * PRICE_PER_EMAIL).toFixed(2)}
                </p>
                <p className="text-muted-foreground">{userBalance} credits</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Each email costs {PRICE_PER_EMAIL} credits
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
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
                    <p className={`font-bold flex items-center gap-1 ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                      <CheckCircle className="h-4 w-4" />
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-orange-500" />
              Purchase Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {CREDIT_PACKAGES.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`relative bg-white/50 backdrop-blur-sm ${
                    pkg.popular ? 'border-2 border-orange-500 shadow-lg scale-105' : ''
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs px-2 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{pkg.credits}</p>
                      <p className="text-muted-foreground">credits</p>
                      <p className="text-xl font-bold mt-2 text-orange-500">
                        RM{pkg.price}
                      </p>
                      <Button
                        className={`w-full mt-4 ${
                          pkg.popular
                            ? "bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                            : "bg-gray-800 hover:bg-gray-900"
                        }`}
                        onClick={() => handlePurchase(pkg.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? "Processing..." : "Purchase"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 