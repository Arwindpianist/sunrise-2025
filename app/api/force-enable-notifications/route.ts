import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Check if VAPID keys are configured
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new NextResponse(JSON.stringify({ 
        error: 'VAPID keys not configured',
        details: 'Please configure NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY'
      }), { status: 400 })
    }

    // Check if user already has active subscriptions
    const { data: existingSubscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)

    if (subError) {
      console.error('Error checking existing subscriptions:', subError)
      return new NextResponse(JSON.stringify({ 
        error: 'Failed to check existing subscriptions',
        details: subError.message 
      }), { status: 500 })
    }

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      return new NextResponse(JSON.stringify({ 
        message: 'User already has active subscriptions',
        subscriptions: existingSubscriptions
      }), { status: 200 })
    }

    // Create a test subscription (this is a simplified version)
    // In a real scenario, this would be done on the client side with proper browser APIs
    const testSubscription = {
      user_id: session.user.id,
      endpoint: `https://fcm.googleapis.com/fcm/send/test-${session.user.id}`,
      p256dh_key: 'test-p256dh-key',
      auth_key: 'test-auth-key',
      is_active: true,
      created_at: new Date().toISOString()
    }

    const { data: newSubscription, error: insertError } = await supabase
      .from('push_subscriptions')
      .insert(testSubscription)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating test subscription:', insertError)
      return new NextResponse(JSON.stringify({ 
        error: 'Failed to create test subscription',
        details: insertError.message 
      }), { status: 500 })
    }

    return new NextResponse(JSON.stringify({
      message: 'Test subscription created successfully',
      subscription: newSubscription,
      note: 'This is a test subscription. Real subscriptions require browser permission and service worker registration.'
    }), { status: 200 })

  } catch (error: any) {
    console.error('Error in force enable notifications:', error)
    return new NextResponse(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), { status: 500 })
  }
}
