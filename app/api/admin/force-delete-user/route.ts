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
      console.log(`User ${userId} is disabled, cleaning up all data and changing email`)
      
      // Step 1: Clean up all user data from database tables
      const cleanupSteps = [
        {
          name: 'email_logs',
          query: async () => {
            const { data: eventIds } = await supabaseAdmin
              .from('events')
              .select('id')
              .eq('user_id', userId)
            
            if (eventIds && eventIds.length > 0) {
              const eventIdArray = eventIds.map(e => e.id)
              return supabaseAdmin
                .from('email_logs')
                .delete()
                .in('event_id', eventIdArray)
            }
            return { error: null }
          }
        },
        {
          name: 'telegram_logs',
          query: async () => {
            const { data: eventIds } = await supabaseAdmin
              .from('events')
              .select('id')
              .eq('user_id', userId)
            
            if (eventIds && eventIds.length > 0) {
              const eventIdArray = eventIds.map(e => e.id)
              return supabaseAdmin
                .from('telegram_logs')
                .delete()
                .in('event_id', eventIdArray)
            }
            return { error: null }
          }
        },
        {
          name: 'event_contacts',
          query: async () => {
            const { data: eventIds } = await supabaseAdmin
              .from('events')
              .select('id')
              .eq('user_id', userId)
            
            if (eventIds && eventIds.length > 0) {
              const eventIdArray = eventIds.map(e => e.id)
              return supabaseAdmin
                .from('event_contacts')
                .delete()
                .in('event_id', eventIdArray)
            }
            return { error: null }
          }
        },
        {
          name: 'transactions',
          query: () => supabaseAdmin.from('transactions').delete().eq('user_id', userId)
        },
        {
          name: 'user_balances',
          query: () => supabaseAdmin.from('user_balances').delete().eq('user_id', userId)
        },
        {
          name: 'user_subscriptions',
          query: () => supabaseAdmin.from('user_subscriptions').delete().eq('user_id', userId)
        },
        {
          name: 'referrals',
          query: () => supabaseAdmin.from('referrals').delete().eq('referrer_id', userId)
        },
        {
          name: 'contacts',
          query: () => supabaseAdmin.from('contacts').delete().eq('user_id', userId)
        },
        {
          name: 'events',
          query: () => supabaseAdmin.from('events').delete().eq('user_id', userId)
        },
        {
          name: 'contact_categories',
          query: () => supabaseAdmin.from('contact_categories').delete().eq('user_id', userId)
        },
        {
          name: 'users',
          query: () => supabaseAdmin.from('users').delete().eq('id', userId)
        }
      ]

      console.log(`Cleaning up data for user: ${userId}`)
      const cleanupResults = []

      for (const step of cleanupSteps) {
        try {
          const { error } = await step.query()
          if (error) {
            console.error(`Error cleaning up ${step.name}:`, error)
            cleanupResults.push({ table: step.name, success: false, error: error.message })
          } else {
            console.log(`Successfully cleaned up ${step.name} for user ${userId}`)
            cleanupResults.push({ table: step.name, success: true })
          }
        } catch (error: any) {
          console.error(`Exception cleaning up ${step.name}:`, error)
          cleanupResults.push({ table: step.name, success: false, error: error.message })
        }
      }

      // Step 2: Try to sign out all sessions
      try {
        await supabaseAdmin.auth.admin.signOut(userId)
        console.log(`Signed out all sessions for user: ${userId}`)
      } catch (signOutError) {
        console.log('Could not sign out user sessions:', signOutError)
      }

      // Step 3: Change the email to free up the original email
      const newEmail = `deleted_${Date.now()}_${email}`
      
      try {
        const { data: { user: updatedUser }, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          email: newEmail,
          user_metadata: { 
            ...user.user_metadata,
            original_email: email,
            force_deleted: true,
            force_deleted_at: new Date().toISOString(),
            cleanup_results: cleanupResults
          },
          email_confirm: false,
          phone_confirm: false
        })
        
        if (updateError) {
          console.error('Email change failed:', updateError)
          logSubscriptionSecurityEvent(userId, 'force_delete_email_change_failed', {
            email,
            error: updateError.message,
            cleanupResults,
            timestamp: new Date().toISOString()
          })
          
          return new NextResponse(
            JSON.stringify({ 
              error: 'Unable to free up email address. Please contact support.',
              details: updateError.message,
              cleanupResults
            }),
            { 
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        } else {
          console.log(`User email changed successfully: ${email} -> ${newEmail}`)
          logSubscriptionSecurityEvent(userId, 'force_delete_complete_success', {
            originalEmail: email,
            newEmail,
            cleanupResults,
            timestamp: new Date().toISOString()
          })
          
          return new NextResponse(
            JSON.stringify({ 
              message: 'User data completely cleaned up and email address freed. You can now create a new account with the original email.',
              userId,
              originalEmail: email,
              newEmail,
              cleanupResults,
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
          cleanupResults,
          timestamp: new Date().toISOString()
        })
        
        return new NextResponse(
          JSON.stringify({ 
            error: 'Failed to free up email address',
            details: error.message,
            cleanupResults
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