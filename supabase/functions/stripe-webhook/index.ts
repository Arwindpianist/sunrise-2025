// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const PRICE_PER_EMAIL = 0.01 // $0.01 per email

serve(async (req: Request) => {
  try {
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Initialize Stripe
    // @ts-ignore
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Get the signature from the headers
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      throw new Error('No signature found')
    }

    // Get the webhook secret
    // @ts-ignore
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new Error('No webhook secret found')
    }

    // Get the raw body
    const body = await req.text()

    // Verify the event
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const { userId, type, credits } = paymentIntent.metadata

        // Update transaction status
        const { error: transactionError } = await supabaseClient
          .from('transactions')
          .update({ status: 'completed' })
          .eq('stripe_payment_id', paymentIntent.id)

        if (transactionError) {
          throw new Error(`Error updating transaction: ${transactionError.message}`)
        }

        // Get current balance
        const { data: balanceData, error: balanceError } = await supabaseClient
          .from('user_balances')
          .select('balance')
          .eq('user_id', userId)
          .single()

        if (balanceError && balanceError.code !== 'PGRST116') {
          throw new Error(`Error getting balance: ${balanceError.message}`)
        }

        const currentBalance = balanceData?.balance || 0
        const newBalance = currentBalance + parseInt(credits)

        // Update or insert balance
        const { error: upsertError } = await supabaseClient
          .from('user_balances')
          .upsert({
            user_id: userId,
            balance: newBalance,
          })

        if (upsertError) {
          throw new Error(`Error updating balance: ${upsertError.message}`)
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object

        // Update transaction status
        const { error: transactionError } = await supabaseClient
          .from('transactions')
          .update({ status: 'failed' })
          .eq('stripe_payment_id', paymentIntent.id)

        if (transactionError) {
          throw new Error(`Error updating transaction: ${transactionError.message}`)
        }

        break
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
}) 