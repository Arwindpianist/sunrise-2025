import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logSubscriptionSecurityEvent } from '@/lib/subscription-security'

// Create admin client for user operations
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

export async function POST(request: Request) {
  try {
    const { email, newEmail } = await request.json()

    if (!email || !newEmail) {
      return new NextResponse(
        JSON.stringify({ error: 'Both email and newEmail are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Email change request: ${email} -> ${newEmail}`)

    // First, get the user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to list users' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Find the user with the specified email
    const user = users?.find(u => u.email === email)
    
    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'User not found with this email' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const userId = user.id
    console.log(`Found user: ${userId} for email: ${email}`)

    // Check if new email is already taken
    const existingUser = users?.find(u => u.email === newEmail)
    if (existingUser && existingUser.id !== userId) {
      return new NextResponse(
        JSON.stringify({ error: 'New email address is already in use by another user' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Change the user's email
    try {
      const { data: { user: updatedUser }, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: newEmail,
        user_metadata: { 
          ...user.user_metadata,
          original_email: email,
          email_changed_at: new Date().toISOString(),
          email_changed_by: 'admin_api'
        },
        email_confirm: false
      })
      
      if (updateError) {
        console.error('Email change failed:', updateError)
        logSubscriptionSecurityEvent(userId, 'admin_email_change_failed', {
          originalEmail: email,
          newEmail,
          error: updateError.message,
          timestamp: new Date().toISOString()
        })
        
        return new NextResponse(
          JSON.stringify({ 
            error: 'Failed to change email address',
            details: updateError.message
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      } else {
        console.log(`User email changed successfully: ${email} -> ${newEmail}`)
        logSubscriptionSecurityEvent(userId, 'admin_email_change_success', {
          originalEmail: email,
          newEmail,
          timestamp: new Date().toISOString()
        })
        
        return new NextResponse(
          JSON.stringify({ 
            message: 'Email address changed successfully',
            userId,
            originalEmail: email,
            newEmail,
            timestamp: new Date().toISOString()
          }),
          { 
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    } catch (error: any) {
      console.error('Exception in email change:', error)
      logSubscriptionSecurityEvent(userId, 'admin_email_change_exception', {
        originalEmail: email,
        newEmail,
        error: error.message,
        timestamp: new Date().toISOString()
      })
      
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to change email address',
          details: error.message
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  } catch (error: any) {
    console.error('Error in email change:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to change email address' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 