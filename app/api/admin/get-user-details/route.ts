import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user is admin
    const userEmail = session.user.email
    if (userEmail !== "arwindpianist@gmail.com") {
      return new NextResponse(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Create service role client to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get user subscription using admin client
    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    // Get user balance using admin client
    const { data: balanceData, error: balanceError } = await supabaseAdmin
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Get user info
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Error fetching user data:', userError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch user data' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new NextResponse(
      JSON.stringify({ 
        success: true,
        user: userData,
        subscription: subscriptionData,
        balance: balanceData
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error: any) {
    console.error('Error in admin get user details:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 