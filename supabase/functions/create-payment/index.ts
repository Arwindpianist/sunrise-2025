// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PRICE_PER_EMAIL = 0.01 // $0.01 per email
const CREDIT_PACKAGES = {
  '100': 0.99,    // 100 credits for $0.99
  '500': 4.99,    // 500 credits for $4.99
  '1000': 9.99,   // 1000 credits for $9.99
  '5000': 49.99,  // 5000 credits for $49.99
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Initialize Stripe
    // @ts-ignore
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const { amount, type } = await req.json()

    if (!amount || !type) {
      throw new Error('Amount and type are required')
    }

    // Get the user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    let credits = 0
    let description = ''

    if (type === 'credits') {
      // Handle credit package purchase
      if (!CREDIT_PACKAGES[amount]) {
        throw new Error('Invalid credit package')
      }
      credits = parseInt(amount)
      description = `Purchase ${credits} email credits`
    } else if (type === 'event') {
      // Handle event email sending
      credits = amount
      description = `Send ${credits} event emails`
    } else {
      throw new Error('Invalid payment type')
    }

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(credits * PRICE_PER_EMAIL * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: user.id,
        type,
        credits,
      },
      description,
    })

    // Create a transaction record
    const { error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'purchase',
        amount: credits,
        description,
        stripe_payment_id: paymentIntent.id,
        status: 'pending',
      })

    if (transactionError) {
      throw new Error(`Error creating transaction: ${transactionError.message}`)
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        credits,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
}) 