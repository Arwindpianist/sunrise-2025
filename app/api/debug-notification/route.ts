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

    const { recipient_user_id, test_message } = await request.json()

    if (!recipient_user_id) {
      return new NextResponse(JSON.stringify({ error: "Missing recipient_user_id" }), { status: 400 })
    }

    console.log('Current user ID:', session.user.id)
    console.log('Recipient user ID:', recipient_user_id)
    console.log('Test message:', test_message || 'Test notification')

    // Test notification creation
    const { data: notificationData, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: recipient_user_id,
        type: 'test',
        title: 'Test Notification',
        message: test_message || 'This is a test notification',
        data: {
          test: true,
          sender_id: session.user.id,
          timestamp: new Date().toISOString()
        },
        is_read: false,
        priority: 'normal'
      })
      .select()
      .single()

    if (notificationError) {
      console.error('Notification creation error:', notificationError)
      return new NextResponse(JSON.stringify({ 
        error: "Failed to create notification", 
        details: notificationError.message,
        code: notificationError.code,
        hint: notificationError.hint
      }), { status: 500 })
    }

    return new NextResponse(JSON.stringify({ 
      message: "Test notification created successfully", 
      notification: notificationData 
    }), { status: 200 })

  } catch (error: any) {
    console.error('Error in debug notification:', error)
    return new NextResponse(JSON.stringify({ 
      error: "Internal server error", 
      details: error.message 
    }), { status: 500 })
  }
}
