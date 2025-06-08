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

const PRICE_PER_EMAIL = 0.05 // RM 0.05 per email

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Balance</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Object.entries(CREDIT_PACKAGES).map(([credits, price]) => (
          <div key={credits} className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">{credits} Credits</h3>
            <p className="text-2xl font-bold mb-4">RM {price.toFixed(2)}</p>
            <Button 
              onClick={() => handlePurchase(credits)}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Processing..." : "Purchase"}
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedPackage ? `Purchase ${selectedPackage.credits} Credits` : 'Payment'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedPackage && (
              <div className="mb-4">
                <p className="text-lg font-semibold">Total: RM {selectedPackage.price.toFixed(2)}</p>
              </div>
            )}
            <form id="payment-form" className="space-y-4">
              <div id="payment-element" className="mb-4">
                {/* Stripe Elements will be mounted here */}
              </div>
              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Processing..." : "Pay Now"}
              </Button>
              <div id="payment-message" className="text-red-500 mt-2"></div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <p className="text-gray-500">No successful transactions yet.</p>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      +{transaction.amount} credits
                    </p>
                    <p className="text-sm text-green-500">
                      Completed
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 