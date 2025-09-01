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
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const {
      recipient_user_id,
      sos_alert_id,
      notification_id,
      user_name,
      location,
      triggered_at
    } = await request.json()

    if (!recipient_user_id || !sos_alert_id || !notification_id) {
      return new NextResponse(JSON.stringify({ error: "Missing required fields" }), { status: 400 })
    }

    // Create in-app notification
    const { data: notificationData, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: recipient_user_id,
        type: 'sos_alert',
        title: '🚨 SOS Alert - Immediate Assistance Required',
        message: `${user_name} has triggered an SOS alert and needs immediate assistance.`,
        data: {
          sos_alert_id: sos_alert_id,
          user_name: user_name,
          location: location,
          triggered_at: triggered_at,
          notification_id: notification_id
        },
        is_read: false,
        priority: 'urgent'
      })
      .select()
      .single()

    if (notificationError) {
      await supabase.from('sos_alert_notifications').update({ 
        status: 'failed', 
        error_message: notificationError.message 
      }).eq('id', notification_id)
      return new NextResponse(JSON.stringify({ 
        error: "Failed to create in-app notification", 
        details: notificationError.message 
      }), { status: 500 })
    }

    // Send push notification if user has enabled it
    try {
      const { data: pushSubscriptions, error: pushError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', recipient_user_id)
        .eq('is_active', true)

      if (!pushError && pushSubscriptions && pushSubscriptions.length > 0) {
        // Send push notification to all active subscriptions
        for (const subscription of pushSubscriptions) {
          try {
            const pushResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push/send`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                subscription: {
                  endpoint: subscription.endpoint,
                  keys: {
                    p256dh: subscription.p256dh_key,
                    auth: subscription.auth_key
                  }
                },
                payload: {
                  title: '🚨 SOS Alert - Immediate Assistance Required',
                  message: `${user_name} has triggered an SOS alert and needs immediate assistance!`,
                  type: 'sos_alert',
                  data: {
                    sos_alert_id: sos_alert_id,
                    user_name: user_name,
                    location: location,
                    triggered_at: triggered_at,
                    notification_id: notification_id
                  },
                  priority: 'urgent',
                  tag: 'sos-alert',
                  actions: [
                    {
                      action: 'view',
                      title: 'View Details'
                    },
                    {
                      action: 'dismiss',
                      title: 'Dismiss'
                    }
                  ]
                }
              })
            })

            if (!pushResponse.ok) {
              console.error('Failed to send push notification:', await pushResponse.text())
            }
          } catch (pushError) {
            console.error('Error sending push notification:', pushError)
          }
        }
      }
    } catch (pushError) {
      console.error('Error checking push subscriptions:', pushError)
      // Don't fail the entire request if push notification fails
    }

    // Update notification status to sent
    await supabase.from('sos_alert_notifications').update({ 
      status: 'sent', 
      sent_at: new Date().toISOString() 
    }).eq('id', notification_id)

    return new NextResponse(JSON.stringify({ 
      message: "SOS notification created and sent successfully", 
      notification: notificationData 
    }), { status: 200 })

  } catch (error: any) {
    console.error('Error creating SOS notification:', error)
    return new NextResponse(JSON.stringify({ 
      error: "Internal server error", 
      details: error.message 
    }), { status: 500 })
  }
}
