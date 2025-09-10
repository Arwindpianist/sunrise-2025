import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import webpush from 'web-push'

export const dynamic = "force-dynamic"

// Configure VAPID keys
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!
}

webpush.setVapidDetails(
  'mailto:admin@sunrise-2025.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
)

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    // Get user's push subscription
    const { data: subscription, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single()

    if (subError || !subscription) {
      return new NextResponse(JSON.stringify({ 
        error: "No active push subscription found",
        details: subError?.message || "No subscription found"
      }), { status: 400 })
    }

    console.log('Found subscription:', {
      id: subscription.id,
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      has_p256dh: !!subscription.p256dh_key,
      has_auth: !!subscription.auth_key,
      is_active: subscription.is_active
    })

    // Create test emergency payload
    const testPayload = JSON.stringify({
      title: '🚨 TEST EMERGENCY ALERT',
      message: 'This is a test emergency notification to verify push notifications are working.',
      type: 'sos_alert',
      priority: 'critical',
      urgent: true,
      timestamp: Date.now(),
      data: {
        sos_alert_id: 'test-' + Date.now(),
        user_name: 'Test User',
        user_email: 'test@example.com',
        user_phone: '+1234567890',
        location: 'Test Location',
        location_lat: 0,
        location_lng: 0,
        triggered_at: new Date().toISOString(),
        formatted_time: new Date().toLocaleString(),
        type: 'sos_alert',
        emergency_level: 'CRITICAL',
        response_required: true,
        time_elapsed: 0,
        location_url: null
      },
      actions: [
        { action: 'view', title: '🚨 VIEW EMERGENCY' },
        { action: 'acknowledge', title: '✓ I\'M RESPONDING' },
        { action: 'call', title: '📞 CALL NOW' }
      ],
      tag: `test-sos-alert-${Date.now()}`,
      requireInteraction: true,
      renotify: true,
      vibrate: [1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000]
    })

    console.log('Sending test push notification...')

    // Convert base64 keys to proper format
    const p256dhKey = Buffer.from(subscription.p256dh_key, 'base64')
    const authKey = Buffer.from(subscription.auth_key, 'base64')

    console.log('Key lengths:', {
      p256dh_length: p256dhKey.length,
      auth_length: authKey.length,
      p256dh_expected: 65,
      auth_expected: 16
    })

    // Send push notification
    const result = await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: p256dhKey,
          auth: authKey
        }
      },
      testPayload
    )

    console.log('Push notification sent successfully:', result)

    return new NextResponse(JSON.stringify({ 
      success: true, 
      message: "Test push notification sent successfully",
      subscription_id: subscription.id,
      result: result
    }), { status: 200 })

  } catch (error: any) {
    console.error('Error sending test push notification:', error)
    return new NextResponse(JSON.stringify({ 
      error: "Failed to send test push notification", 
      details: error.message,
      statusCode: error.statusCode
    }), { status: 500 })
  }
}
