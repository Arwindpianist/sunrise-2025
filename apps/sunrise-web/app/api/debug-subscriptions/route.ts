import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Check VAPID configuration
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

    // Get all subscriptions for the user
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', session.user.id)

    if (subError) {
      console.error('Error fetching subscriptions:', subError)
      return new NextResponse(JSON.stringify({ 
        error: 'Failed to fetch subscriptions',
        details: subError.message 
      }), { status: 500 })
    }

    // Get active subscriptions
    const activeSubscriptions = subscriptions?.filter(sub => sub.is_active) || []

    const result = {
      user_id: session.user.id,
      user_email: session.user.email,
      vapid_configured: {
        has_public_key: !!vapidPublicKey,
        has_private_key: !!vapidPrivateKey,
        public_key_length: vapidPublicKey?.length || 0,
        private_key_length: vapidPrivateKey?.length || 0
      },
      subscriptions: {
        total: subscriptions?.length || 0,
        active: activeSubscriptions.length,
        inactive: (subscriptions?.length || 0) - activeSubscriptions.length,
        details: subscriptions || []
      },
      environment: {
        site_url: process.env.NEXT_PUBLIC_SITE_URL,
        node_env: process.env.NODE_ENV
      }
    }

    return new NextResponse(JSON.stringify(result), { status: 200 })

  } catch (error: any) {
    console.error('Error in debug subscriptions:', error)
    return new NextResponse(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), { status: 500 })
  }
}
