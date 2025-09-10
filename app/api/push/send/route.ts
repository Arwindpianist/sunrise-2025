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
  'mailto:admin@sunrise-2025.com', // Replace with your email
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

    const { subscription, payload } = await request.json()

    if (!subscription || !payload) {
      return new NextResponse(JSON.stringify({ error: "Missing subscription or payload" }), { status: 400 })
    }

    // Prepare the push message
    const pushPayload = JSON.stringify({
      title: payload.title,
      message: payload.message,
      type: payload.type,
      data: payload.data || {},
      priority: payload.priority || 'normal',
      tag: payload.tag,
      actions: payload.actions || [],
      // Add urgency indicators
      urgent: payload.type === 'sos_alert' || payload.priority === 'urgent',
      timestamp: Date.now(),
      // Enhanced message for SOS alerts
      ...(payload.type === 'sos_alert' && {
        title: `🚨 URGENT SOS ALERT: ${payload.title}`,
        message: `🚨 ${payload.message} - IMMEDIATE ACTION REQUIRED!`,
        priority: 'urgent'
      })
    })

    // Convert base64 keys to proper format
    const p256dhKey = Buffer.from(subscription.keys.p256dh, 'base64')
    const authKey = Buffer.from(subscription.keys.auth, 'base64')

    // Send the push notification
    const result = await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: p256dhKey,
          auth: authKey
        }
      },
      pushPayload
    )

    console.log('Push notification sent successfully:', result)

    return new NextResponse(JSON.stringify({ 
      success: true, 
      message: "Push notification sent successfully" 
    }), { status: 200 })

  } catch (error: any) {
    console.error('Error sending push notification:', error)
    
    // Handle specific web-push errors
    if (error.statusCode) {
      // If subscription is invalid, mark it as inactive in database
      if (error.statusCode === 410) {
        try {
          const cookieStore = cookies()
          const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
          
          const requestBody = await request.json()
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('endpoint', requestBody.subscription.endpoint)
        } catch (dbError) {
          console.error('Failed to update subscription status:', dbError)
        }
      }
      
      return new NextResponse(JSON.stringify({ 
        error: "Push notification failed", 
        statusCode: error.statusCode,
        details: error.message 
      }), { status: 400 })
    }

    return new NextResponse(JSON.stringify({ 
      error: "Internal server error", 
      details: error.message 
    }), { status: 500 })
  }
}
