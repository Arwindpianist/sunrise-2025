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

    const { test_type = 'in_app' } = await request.json()

    if (test_type === 'in_app') {
      // Test in-app notification
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: session.user.id,
          type: 'test',
          title: '🧪 Test Notification',
          message: 'This is a test notification to verify the system is working.',
          data: {
            test: true,
            timestamp: new Date().toISOString()
          },
          is_read: false,
          priority: 'normal'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating test notification:', error)
        return new NextResponse(JSON.stringify({ 
          error: 'Failed to create test notification',
          details: error.message 
        }), { status: 500 })
      }

      return new NextResponse(JSON.stringify({ 
        success: true, 
        message: 'Test notification created successfully',
        notification 
      }), { status: 200 })
    }

    if (test_type === 'push') {
      // Test push notification
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)

      if (subError || !subscriptions || subscriptions.length === 0) {
        return new NextResponse(JSON.stringify({ 
          error: 'No active push subscriptions found',
          details: 'Please enable notifications in the SOS page first'
        }), { status: 400 })
      }

      // Send test push notification
      for (const subscription of subscriptions) {
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
                title: '🧪 Test Push Notification',
                message: 'This is a test push notification to verify the system is working!',
                type: 'test',
                data: {
                  test: true,
                  timestamp: new Date().toISOString()
                },
                priority: 'normal',
                tag: 'test-notification'
              }
            })
          })

          if (!pushResponse.ok) {
            console.error('Failed to send test push notification:', await pushResponse.text())
          }
        } catch (error) {
          console.error('Error sending test push notification:', error)
        }
      }

      return new NextResponse(JSON.stringify({ 
        success: true, 
        message: 'Test push notification sent successfully',
        subscriptions_count: subscriptions.length
      }), { status: 200 })
    }

    return new NextResponse(JSON.stringify({ 
      error: 'Invalid test type. Use "in_app" or "push"' 
    }), { status: 400 })

  } catch (error: any) {
    console.error('Error in test notification:', error)
    return new NextResponse(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), { status: 500 })
  }
}
