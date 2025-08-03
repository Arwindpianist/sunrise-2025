import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logSubscriptionSecurityEvent } from '@/lib/subscription-security'

// Create admin client for user deletion
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
    const { email } = await request.json()

    if (!email) {
      return new NextResponse(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Force delete request for email: ${email}`)

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

    // Check if user is disabled
    if (user.user_metadata?.deleted) {
      console.log(`User ${userId} is disabled, attempting email change approach`)
      
      // Try to sign out all sessions first
      try {
        await supabaseAdmin.auth.admin.signOut(userId)
        console.log(`Signed out all sessions for user: ${userId}`)
      } catch (signOutError) {
        console.log('Could not sign out user sessions:', signOutError)
      }

      // Instead of deleting, change the email to free up the original email
      const newEmail = `deleted_${Date.now()}_${email}`
      
      try {
        const { data: { user: updatedUser }, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          email: newEmail,
          user_metadata: { 
            ...user.user_metadata,
            original_email: email,
            force_deleted: true,
            force_deleted_at: new Date().toISOString()
          },
          email_confirm: false,
          phone_confirm: false
        })
        
        if (updateError) {
          console.error('Email change failed:', updateError)
          logSubscriptionSecurityEvent(userId, 'force_delete_email_change_failed', {
            email,
            error: updateError.message,
            timestamp: new Date().toISOString()
          })
          
          return new NextResponse(
            JSON.stringify({ 
              error: 'Unable to free up email address. Please contact support.',
              details: updateError.message 
            }),
            { 
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        } else {
          console.log(`User email changed successfully: ${email} -> ${newEmail}`)
          logSubscriptionSecurityEvent(userId, 'force_delete_email_change_success', {
            originalEmail: email,
            newEmail,
            timestamp: new Date().toISOString()
          })
          
          return new NextResponse(
            JSON.stringify({ 
              message: 'Email address freed up successfully. You can now create a new account with the original email.',
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
        logSubscriptionSecurityEvent(userId, 'force_delete_email_change_exception', {
          email,
          error: error.message,
          timestamp: new Date().toISOString()
        })
        
        return new NextResponse(
          JSON.stringify({ 
            error: 'Failed to free up email address',
            details: error.message 
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    } else {
      return new NextResponse(
        JSON.stringify({ error: 'User is not disabled. Only disabled users can be force deleted.' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  } catch (error: any) {
    console.error('Error in force delete:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to force delete user' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 