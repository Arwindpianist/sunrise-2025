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

    // Use the database function to create the notification (bypasses RLS)
    const { data: notificationResult, error: functionError } = await supabase
      .rpc('create_sos_notification', {
        recipient_user_id: recipient_user_id,
        sos_alert_id: sos_alert_id,
        notification_id: notification_id,
        user_name: user_name || 'Unknown User',
        location_data: location || {},
        triggered_at: triggered_at || new Date().toISOString()
      })

    if (functionError) {
      console.error('Database function error:', functionError)
      
      // Update notification status to failed
      await supabase.from('sos_alert_notifications').update({ 
        status: 'failed', 
        error_message: functionError.message 
      }).eq('id', notification_id)
      
      return new NextResponse(JSON.stringify({ 
        error: "Failed to create in-app notification", 
        details: functionError.message 
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
                  title: '🚨 URGENT SOS ALERT',
                  message: `🚨 ${user_name || 'Unknown User'} needs IMMEDIATE assistance! Location: ${location || 'Unknown'}`,
                  type: 'sos_alert',
                  data: {
                    sos_alert_id: sos_alert_id,
                    user_name: user_name || 'Unknown User',
                    location: location,
                    triggered_at: triggered_at,
                    notification_id: notification_id
                  },
                  priority: 'urgent',
                  tag: 'sos-alert',
                  actions: [
                    {
                      action: 'view',
                      title: '🚨 VIEW NOW'
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

    return new NextResponse(JSON.stringify({ 
      message: "SOS notification created and sent successfully", 
      notification_id: notificationResult 
    }), { status: 200 })

  } catch (error: any) {
    console.error('Error creating SOS notification:', error)
    return new NextResponse(JSON.stringify({ 
      error: "Internal server error", 
      details: error.message 
    }), { status: 500 })
  }
}
