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

    const { 
      sos_alert_id, 
      recipient_user_id, 
      user_name, 
      location, 
      triggered_at 
    } = await request.json()

    if (!sos_alert_id || !recipient_user_id || !user_name) {
      return new NextResponse(JSON.stringify({ error: "Missing required fields" }), { status: 400 })
    }

    // Get the recipient's push subscription
    const { data: subscription, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', recipient_user_id)
      .eq('is_active', true)
      .single()

    if (subError || !subscription) {
      console.log('No active push subscription found for user:', recipient_user_id)
      return new NextResponse(JSON.stringify({ 
        success: false, 
        message: "No active push subscription found for recipient" 
      }), { status: 200 })
    }

    // Create enhanced emergency notification payload
    const emergencyPayload = JSON.stringify({
      title: '🚨 URGENT SOS ALERT',
      message: `${user_name} needs IMMEDIATE assistance!`,
      type: 'sos_alert',
      priority: 'urgent',
      urgent: true,
      timestamp: Date.now(),
      data: {
        sos_alert_id,
        user_name,
        location: location || 'Location not available',
        triggered_at: triggered_at || new Date().toISOString(),
        type: 'sos_alert'
      },
      actions: [
        {
          action: 'view',
          title: '🚨 VIEW NOW'
        },
        {
          action: 'acknowledge',
          title: '✓ ACKNOWLEDGE'
        }
      ],
      tag: `sos-alert-${sos_alert_id}-${Date.now()}`,
      requireInteraction: true,
      renotify: true
    })

    // Send the emergency push notification with retry logic
    let retryCount = 0
    const maxRetries = 3
    let lastError = null

    while (retryCount < maxRetries) {
      try {
        const result = await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh_key,
              auth: subscription.auth_key
            }
          },
          emergencyPayload
        )

        console.log('Emergency push notification sent successfully:', result)

        // Update notification status in database
        await supabase
          .from('sos_alert_notifications')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('sos_alert_id', sos_alert_id)
          .eq('emergency_contact_id', subscription.user_id)

        return new NextResponse(JSON.stringify({ 
          success: true, 
          message: "Emergency notification sent successfully" 
        }), { status: 200 })

      } catch (error: any) {
        lastError = error
        retryCount++
        
        console.error(`Emergency notification attempt ${retryCount} failed:`, error)
        
        // If subscription is invalid, mark it as inactive
        if (error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', subscription.id)
          
          return new NextResponse(JSON.stringify({ 
            success: false, 
            message: "Push subscription is invalid and has been deactivated" 
          }), { status: 200 })
        }
        
        // Wait before retry (exponential backoff)
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
        }
      }
    }

    // All retries failed
    console.error('All emergency notification attempts failed:', lastError)
    
    // Update notification status to failed
    await supabase
      .from('sos_alert_notifications')
      .update({ 
        status: 'failed',
        error_message: lastError?.message || 'All retry attempts failed'
      })
      .eq('sos_alert_id', sos_alert_id)
      .eq('emergency_contact_id', subscription.user_id)

    return new NextResponse(JSON.stringify({ 
      success: false, 
      message: "Failed to send emergency notification after all retries",
      error: lastError?.message 
    }), { status: 500 })

  } catch (error: any) {
    console.error('Error sending emergency notification:', error)
    return new NextResponse(JSON.stringify({ 
      error: "Internal server error", 
      details: error.message 
    }), { status: 500 })
  }
}
