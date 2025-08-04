import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
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

    const body = await request.json()
    const { userId, balance } = body

    if (!userId || balance === undefined || balance === null) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (balance < 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Token balance cannot be negative' }),
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

    // Get current balance using admin client
    const { data: currentBalance } = await supabaseAdmin
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single()

    const oldBalance = currentBalance?.balance || 0

    // Update or create user balance using admin client
    const { error: balanceError } = await supabaseAdmin
      .from('user_balances')
      .upsert({
        user_id: userId,
        balance: balance,
        updated_at: new Date().toISOString()
      })

    if (balanceError) {
      console.error('Error updating user balance:', balanceError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to update token balance' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Record the transaction using admin client
    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'admin_adjustment',
        amount: balance - oldBalance,
        description: `Admin balance adjustment: ${oldBalance} → ${balance} tokens`,
        status: 'completed',
        created_at: new Date().toISOString()
      })

    if (transactionError) {
      console.error('Error recording transaction:', transactionError)
      // Don't fail the request if transaction recording fails
    }

    // Log the admin action
    console.log(`Admin ${userEmail} updated token balance for user ${userId}: ${oldBalance} → ${balance}`)

    return new NextResponse(
      JSON.stringify({ 
        success: true,
        message: 'Token balance updated successfully',
        oldBalance,
        newBalance: balance
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error: any) {
    console.error('Error in admin token balance update:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 