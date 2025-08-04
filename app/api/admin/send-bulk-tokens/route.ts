import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { sendComplimentaryTokens } from "@/lib/zoho-email"

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
    const { tokens, message, action = 'add' } = body // Add action parameter

    if (!tokens || tokens <= 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid token amount' }),
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

    // Get all users with their email and name using admin client
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch users' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (!users || users.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'No users found' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    let updatedCount = 0
    let emailSentCount = 0
    const errors: string[] = []
    const emailErrors: string[] = []

    // Process each user
    for (const user of users) {
      try {
        // Get current balance using admin client
        const { data: currentBalance, error: balanceError } = await supabaseAdmin
          .from('user_balances')
          .select('balance')
          .eq('user_id', user.id)
          .single()

        const oldBalance = currentBalance?.balance || 0
        
        // Calculate new balance based on action
        let newBalance = oldBalance
        if (action === 'add') {
          newBalance = oldBalance + tokens
        } else if (action === 'deduct') {
          newBalance = Math.max(0, oldBalance - tokens) // Prevent negative balance
        }

        // Update or create user balance using admin client
        let balanceUpdateError = null
        
        if (currentBalance) {
          // Update existing record
          const { error: updateError } = await supabaseAdmin
            .from('user_balances')
            .update({
              balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
          
          balanceUpdateError = updateError
        } else {
          // Insert new record (only for add action)
          if (action === 'add') {
            const { error: insertError } = await supabaseAdmin
              .from('user_balances')
              .insert({
                user_id: user.id,
                balance: newBalance,
                updated_at: new Date().toISOString()
              })
            
            balanceUpdateError = insertError
          }
        }

        if (balanceUpdateError) {
          console.error(`Error updating balance for user ${user.id}:`, balanceUpdateError)
          errors.push(`Failed to update user ${user.id}`)
          continue
        }

        // Record the transaction using admin client
        const transactionAmount = action === 'add' ? tokens : -tokens
        const transactionDescription = action === 'add' 
          ? (message || `Complimentary tokens from admin`)
          : (message || `Token deduction by admin`)

        const { error: transactionError } = await supabaseAdmin
          .from('transactions')
          .insert({
            user_id: user.id,
            type: 'admin_adjustment', // Use valid enum value
            amount: transactionAmount,
            description: transactionDescription,
            status: 'completed',
            created_at: new Date().toISOString()
          })

        if (transactionError) {
          console.error(`Error recording transaction for user ${user.id}:`, transactionError)
          // Don't fail the entire operation if transaction recording fails
        }

        // Send email notification (only for add action)
        if (action === 'add' && user.email) {
          try {
            const userName = user.full_name || user.email.split('@')[0]
            const emailSent = await sendComplimentaryTokens(
              user.email,
              userName,
              tokens,
              newBalance,
              message || ''
            )
            
            if (emailSent) {
              emailSentCount++
            } else {
              emailErrors.push(`Failed to send email to ${user.email}`)
            }
          } catch (emailError) {
            console.error(`Error sending email to ${user.email}:`, emailError)
            emailErrors.push(`Failed to send email to ${user.email}`)
          }
        }

        updatedCount++
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
        errors.push(`Failed to process user ${user.id}`)
      }
    }

    // Log the admin action
    const actionText = action === 'add' ? 'sent' : 'deducted'
    console.log(`Admin ${userEmail} ${actionText} ${tokens} tokens to ${updatedCount} users and ${emailSentCount} emails sent`)

    return new NextResponse(
      JSON.stringify({ 
        success: true,
        message: `Successfully ${actionText} ${tokens} tokens to ${updatedCount} users`,
        updatedCount,
        emailSentCount,
        totalUsers: users.length,
        action,
        errors: errors.length > 0 ? errors : undefined,
        emailErrors: emailErrors.length > 0 ? emailErrors : undefined
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error: any) {
    console.error('Error in bulk token distribution:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 