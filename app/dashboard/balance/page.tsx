"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { loadStripe } from '@stripe/stripe-js'
import { Coins, TrendingUp, Clock, CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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

type CreditPackageId = '100' | '500' | '1000' | '5000'

const CREDIT_PACKAGES: Record<CreditPackageId, number> = {
  '100': 4.90,    // 100 credits for RM 4.90
  '500': 19.90,   // 500 credits for RM 19.90
  '1000': 39.90,  // 1000 credits for RM 39.90
  '5000': 199.90, // 5000 credits for RM 199.90
}

const PRICE_PER_EMAIL = 0.05 // RM 0.05 per email (1 token)

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
  const [selectedPackage, setSelectedPackage] = useState<{credits: string, price: number} | null>(null)
  const [userBalance, setUserBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])

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

  const handlePurchase = async (packageId: string) => {
    try {
      setIsLoading(true)
      setSelectedPackage({
        credits: packageId,
        price: CREDIT_PACKAGES[packageId as CreditPackageId]
      })
      setIsPaymentOpen(true)

      // Create payment intent
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("No active session")

      const { data, error } = await supabase.functions.invoke<PaymentResponse>('create-payment', {
        body: {
          amount: packageId,
          type: 'credits',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="grid gap-4 sm:gap-8 grid-cols-1 md:grid-cols-2">
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
                  Each email costs 1 token (RM{PRICE_PER_EMAIL.toFixed(2)})
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
                        +{transaction.amount} credits
                        <CheckCircle className="h-4 w-4" />
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 sm:mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-orange-500" />
              Purchase Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
              {Object.entries(CREDIT_PACKAGES).map(([credits, price]) => (
                <Card
                  key={credits}
                  className="relative bg-white/50 backdrop-blur-sm hover:shadow-lg transition-shadow"
                >
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{credits}</p>
                      <p className="text-muted-foreground">tokens</p>
                      <p className="text-xl font-bold mt-2 text-orange-500">
                        RM{price.toFixed(2)}
                      </p>
                      <Button 
                        className="w-full mt-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                        onClick={() => handlePurchase(credits)}
                        disabled={isLoading}
                      >
                        {isLoading ? "Processing..." : "Purchase Tokens"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </div>
      </div>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-orange-500" />
              {selectedPackage ? `Purchase ${selectedPackage.credits} Tokens` : 'Payment'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedPackage && (
              <div className="mb-4 text-center">
                <p className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                  RM {selectedPackage.price.toFixed(2)}
                </p>
                <p className="text-muted-foreground">{selectedPackage.credits} tokens</p>
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