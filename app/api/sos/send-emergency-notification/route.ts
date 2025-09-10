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
      user_email,
      user_phone,
      location, 
      location_lat,
      location_lng,
      triggered_at,
      emergency_contact_name,
      emergency_contact_priority
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

    // Format timestamp for display
    const alertTime = new Date(triggered_at || Date.now())
    const formattedTime = alertTime.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    })

    // Create comprehensive emergency notification payload
    const emergencyPayload = JSON.stringify({
      title: '🚨 EMERGENCY SOS ALERT',
      message: `URGENT: ${user_name} needs IMMEDIATE assistance!`,
      type: 'sos_alert',
      priority: 'critical',
      urgent: true,
      timestamp: Date.now(),
      data: {
        sos_alert_id,
        user_name,
        user_email: user_email || 'Not provided',
        user_phone: user_phone || 'Not provided',
        location: location || 'Location not available',
        location_lat: location_lat || null,
        location_lng: location_lng || null,
        triggered_at: triggered_at || new Date().toISOString(),
        formatted_time: formattedTime,
        emergency_contact_name: emergency_contact_name || 'Emergency Contact',
        emergency_contact_priority: emergency_contact_priority || 1,
        type: 'sos_alert',
        // Emergency-specific data
        emergency_level: 'CRITICAL',
        response_required: true,
        time_elapsed: Math.floor((Date.now() - new Date(triggered_at || Date.now()).getTime()) / 1000),
        location_url: location_lat && location_lng 
          ? `https://www.google.com/maps?q=${location_lat},${location_lng}`
          : null
      },
      actions: [
        {
          action: 'view',
          title: '🚨 VIEW EMERGENCY'
        },
        {
          action: 'acknowledge',
          title: '✓ I\'M RESPONDING'
        },
        {
          action: 'call',
          title: '📞 CALL NOW'
        }
      ],
      tag: `sos-alert-${sos_alert_id}-${Date.now()}`,
      requireInteraction: true,
      renotify: true,
      // Enhanced notification options
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      image: null, // Could add emergency contact photo
      sound: 'emergency-alert', // Custom emergency sound
      vibrate: [1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000],
      // Emergency-specific styling
      color: '#dc2626', // Red color for emergency
      background_color: '#fef2f2',
      // Additional emergency context
      emergency_context: {
        alert_type: 'SOS',
        severity: 'CRITICAL',
        requires_immediate_response: true,
        contact_priority: emergency_contact_priority || 1,
        estimated_response_time: 'IMMEDIATE'
      }
    })

    // Use keys as strings (webpush library expects base64 strings)
    console.log('Emergency notification key info:', {
      p256dh_length: subscription.p256dh_key.length,
      auth_length: subscription.auth_key.length,
      p256dh_expected: 88, // Base64 encoded 65 bytes = 88 characters
      auth_expected: 24    // Base64 encoded 16 bytes = 24 characters
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
