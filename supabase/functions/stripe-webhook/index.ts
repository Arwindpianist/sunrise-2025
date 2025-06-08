// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

serve(async (req: Request) => {
  // Log all incoming headers for debugging
  console.log('Incoming request headers:', Object.fromEntries(req.headers.entries()))

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    // Get the raw body first
    const body = await req.text()
    console.log('Request body:', body)

    // Check if this is a Stripe webhook
    const signature = req.headers.get('stripe-signature')
    console.log('Stripe signature:', signature)

    // Initialize Stripe
    // @ts-ignore
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2025-05-28.basil',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let event

    // If this is a Stripe webhook
    if (signature) {
      // @ts-ignore
      const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
      console.log('Webhook secret exists:', !!webhookSecret)

      if (!webhookSecret) {
        console.error('Missing STRIPE_WEBHOOK_SECRET environment variable')
        return new Response(
          JSON.stringify({ error: 'Server configuration error' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        )
      }

      try {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          webhookSecret
        )
        console.log('Event constructed successfully:', event.type)
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message)
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }
    } else {
      // This is a regular authenticated request
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'No authorization header' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          }
        )
      }

      try {
        event = JSON.parse(body)
        console.log('Parsed event from authenticated request:', event)
      } catch (err) {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON body' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const { userId, type, credits } = paymentIntent.metadata
        console.log('Processing successful payment:', { userId, type, credits })

        if (type === 'credits') {
          // Add credits to user's balance
          const { error } = await supabaseClient
            .from('user_credits')
            .upsert({
              user_id: userId,
              credits: parseInt(credits),
              last_updated: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            })

          if (error) {
            console.error('Error updating user credits:', error)
            throw error
          }
          console.log('Successfully updated user credits')
        }

        break
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        console.error('Payment failed:', paymentIntent.last_payment_error)
        break
      }
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object
        console.log('Payment canceled:', paymentIntent.id)
        break
      }
      default: {
        console.log(`Unhandled event type: ${event.type}`)
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
}) 