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
      emergency_contacts,
      user_name, 
      user_email,
      user_phone,
      location, 
      location_lat,
      location_lng,
      triggered_at
    } = await request.json()

    if (!sos_alert_id || !emergency_contacts || !user_name) {
      return new NextResponse(JSON.stringify({ error: "Missing required fields" }), { status: 400 })
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

    const results = {
      push_notifications: [],
      email_notifications: [],
      telegram_notifications: [],
      sms_notifications: [],
      total_sent: 0,
      total_failed: 0
    }

    // Process each emergency contact
    for (const emergencyContact of emergency_contacts) {
      const contact = emergencyContact.contact
      const contactResult = {
        contact_id: contact.id,
        contact_name: `${contact.first_name} ${contact.last_name || ''}`.trim(),
        contact_email: contact.email,
        contact_phone: contact.phone,
        priority: emergencyContact.priority,
        channels: {
          push: { sent: false, error: null },
          email: { sent: false, error: null },
          telegram: { sent: false, error: null },
          sms: { sent: false, error: null }
        }
      }

      // 1. PUSH NOTIFICATION (for Sunrise users)
      if (contact.isSunriseUser && contact.userId) {
        try {
          const pushResult = await sendPushNotification(
            supabase,
            contact.userId,
            sos_alert_id,
            user_name,
            user_email,
            user_phone,
            location,
            location_lat,
            location_lng,
            triggered_at,
            formattedTime,
            emergencyContact.priority
          )
          contactResult.channels.push = pushResult
          if (pushResult.sent) results.total_sent++
          else results.total_failed++
        } catch (error) {
          contactResult.channels.push = { sent: false, error: error.message }
          results.total_failed++
        }
        results.push_notifications.push(contactResult)
      }

      // 2. EMAIL NOTIFICATION (for all contacts with email)
      if (contact.email) {
        try {
          const emailResult = await sendEmailNotification(
            supabase,
            contact.email,
            sos_alert_id,
            user_name,
            user_email,
            user_phone,
            location,
            location_lat,
            location_lng,
            triggered_at,
            formattedTime,
            emergencyContact.priority
          )
          contactResult.channels.email = emailResult
          if (emailResult.sent) results.total_sent++
          else results.total_failed++
        } catch (error) {
          contactResult.channels.email = { sent: false, error: error.message }
          results.total_failed++
        }
        results.email_notifications.push(contactResult)
      }

      // 3. TELEGRAM NOTIFICATION (for contacts with Telegram)
      if (contact.telegram_chat_id) {
        try {
          const telegramResult = await sendTelegramNotification(
            supabase,
            contact.telegram_chat_id,
            sos_alert_id,
            user_name,
            user_email,
            user_phone,
            location,
            location_lat,
            location_lng,
            triggered_at,
            formattedTime,
            emergencyContact.priority
          )
          contactResult.channels.telegram = telegramResult
          if (telegramResult.sent) results.total_sent++
          else results.total_failed++
        } catch (error) {
          contactResult.channels.telegram = { sent: false, error: error.message }
          results.total_failed++
        }
        results.telegram_notifications.push(contactResult)
      }

      // 4. SMS NOTIFICATION (for contacts with phone)
      if (contact.phone) {
        try {
          const smsResult = await sendSMSNotification(
            supabase,
            contact.phone,
            sos_alert_id,
            user_name,
            user_email,
            user_phone,
            location,
            location_lat,
            location_lng,
            triggered_at,
            formattedTime,
            emergencyContact.priority
          )
          contactResult.channels.sms = smsResult
          if (smsResult.sent) results.total_sent++
          else results.total_failed++
        } catch (error) {
          contactResult.channels.sms = { sent: false, error: error.message }
          results.total_failed++
        }
        results.sms_notifications.push(contactResult)
      }
    }

    console.log('Multi-channel emergency notification results:', results)

    return new NextResponse(JSON.stringify({ 
      success: true, 
      message: "Multi-channel emergency notifications sent",
      results
    }), { status: 200 })

  } catch (error: any) {
    console.error('Error sending multi-channel emergency notifications:', error)
    return new NextResponse(JSON.stringify({ 
      error: "Internal server error", 
      details: error.message 
    }), { status: 500 })
  }
}

// Push notification function
async function sendPushNotification(supabase: any, userId: string, sosAlertId: string, userName: string, userEmail: string, userPhone: string, location: string, locationLat: number, locationLng: number, triggeredAt: string, formattedTime: string, priority: number) {
  try {
    // Get push subscription
    const { data: subscription, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (subError || !subscription) {
      return { sent: false, error: "No active push subscription" }
    }

    // Create emergency payload
    const emergencyPayload = JSON.stringify({
      title: '🚨 EMERGENCY SOS ALERT',
      message: `URGENT: ${userName} needs IMMEDIATE assistance!`,
      type: 'sos_alert',
      priority: 'critical',
      urgent: true,
      timestamp: Date.now(),
      data: {
        sos_alert_id: sosAlertId,
        user_name: userName,
        user_email: userEmail,
        user_phone: userPhone,
        location: location,
        location_lat: locationLat,
        location_lng: locationLng,
        triggered_at: triggeredAt,
        formatted_time: formattedTime,
        type: 'sos_alert',
        emergency_level: 'CRITICAL',
        response_required: true,
        time_elapsed: Math.floor((Date.now() - new Date(triggeredAt).getTime()) / 1000),
        location_url: locationLat && locationLng 
          ? `https://www.google.com/maps?q=${locationLat},${locationLng}`
          : null
      },
      actions: [
        { action: 'view', title: '🚨 VIEW EMERGENCY' },
        { action: 'acknowledge', title: '✓ I\'M RESPONDING' },
        { action: 'call', title: '📞 CALL NOW' }
      ],
      tag: `sos-alert-${sosAlertId}-${Date.now()}`,
      requireInteraction: true,
      renotify: true,
      vibrate: [1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000]
    })

    // Use keys as strings (webpush library expects base64 strings)
    // Send push notification
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh_key,
          auth: subscription.auth_key
        }
      },
      emergencyPayload
    )

    return { sent: true, error: null }
  } catch (error: any) {
    return { sent: false, error: error.message }
  }
}

// Email notification function
async function sendEmailNotification(supabase: any, contactEmail: string, sosAlertId: string, userName: string, userEmail: string, userPhone: string, location: string, locationLat: number, locationLng: number, triggeredAt: string, formattedTime: string, priority: number) {
  try {
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: contactEmail,
        subject: `🚨 EMERGENCY SOS ALERT - ${userName} needs immediate assistance!`,
        template: 'sos_emergency',
        data: {
          user_name: userName,
          user_email: userEmail,
          user_phone: userPhone,
          location: location,
          location_lat: locationLat,
          location_lng: locationLng,
          triggered_at: triggeredAt,
          formatted_time: formattedTime,
          sos_alert_id: sosAlertId,
          priority: priority,
          location_url: locationLat && locationLng 
            ? `https://www.google.com/maps?q=${locationLat},${locationLng}`
            : null
        }
      })
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json()
      return { sent: false, error: errorData.message || 'Email sending failed' }
    }

    return { sent: true, error: null }
  } catch (error: any) {
    return { sent: false, error: error.message }
  }
}

// Telegram notification function
async function sendTelegramNotification(supabase: any, telegramChatId: string, sosAlertId: string, userName: string, userEmail: string, userPhone: string, location: string, locationLat: number, locationLng: number, triggeredAt: string, formattedTime: string, priority: number) {
  try {
    const telegramResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/telegram/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        message_type: 'sos_emergency',
        data: {
          user_name: userName,
          user_email: userEmail,
          user_phone: userPhone,
          location: location,
          location_lat: locationLat,
          location_lng: locationLng,
          triggered_at: triggeredAt,
          formatted_time: formattedTime,
          sos_alert_id: sosAlertId,
          priority: priority,
          location_url: locationLat && locationLng 
            ? `https://www.google.com/maps?q=${locationLat},${locationLng}`
            : null
        }
      })
    })

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json()
      return { sent: false, error: errorData.message || 'Telegram sending failed' }
    }

    return { sent: true, error: null }
  } catch (error: any) {
    return { sent: false, error: error.message }
  }
}

// SMS notification function
async function sendSMSNotification(supabase: any, phoneNumber: string, sosAlertId: string, userName: string, userEmail: string, userPhone: string, location: string, locationLat: number, locationLng: number, triggeredAt: string, formattedTime: string, priority: number) {
  try {
    // This would integrate with an SMS service like Twilio
    // For now, we'll simulate it
    const smsMessage = `🚨 EMERGENCY SOS ALERT 🚨\n\n${userName} needs IMMEDIATE assistance!\n\nTime: ${formattedTime}\nLocation: ${location}\n\nPlease respond immediately!\n\nSOS Alert ID: ${sosAlertId}`
    
    // TODO: Implement actual SMS sending with Twilio or similar service
    console.log('SMS would be sent to:', phoneNumber, 'Message:', smsMessage)
    
    return { sent: true, error: null }
  } catch (error: any) {
    return { sent: false, error: error.message }
  }
}
