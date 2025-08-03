import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { logSubscriptionSecurityEvent } from '@/lib/subscription-security'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

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

    const userId = session.user.id
    const { confirmation, forceDelete } = await request.json()

    if (!confirmation || confirmation !== 'DELETE_MY_DATA') {
      return new NextResponse(
        JSON.stringify({ error: 'Confirmation required. Please type DELETE_MY_DATA to confirm.' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // If forceDelete is true, try to completely remove the user from Supabase Auth
    if (forceDelete) {
      try {
        console.log(`Force deleting user from Supabase Auth: ${userId}`)
        
        // First, try to sign out all sessions
        try {
          await supabaseAdmin.auth.admin.signOut(userId)
          console.log(`Signed out all sessions for user: ${userId}`)
        } catch (signOutError) {
          console.log('Could not sign out user sessions:', signOutError)
        }
        
        // Try to delete the user completely
        const { data: { user: adminUser }, error: adminError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        
        if (adminError) {
          console.error('Force deletion failed:', adminError)
          return new NextResponse(
            JSON.stringify({ 
              error: 'Unable to completely delete user account. Please contact support.',
              details: adminError.message 
            }),
            { 
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        } else {
          console.log(`User force deleted from Supabase Auth: ${userId}`)
          logSubscriptionSecurityEvent(userId, 'supabase_user_force_deleted', {
            timestamp: new Date().toISOString()
          })
          
          return new NextResponse(
            JSON.stringify({ 
              message: 'Account completely deleted. You can now create a new account with the same email.',
              timestamp: new Date().toISOString()
            }),
            { 
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        }
      } catch (error: any) {
        console.error('Exception in force deletion:', error)
        return new NextResponse(
          JSON.stringify({ 
            error: 'Force deletion failed',
            details: error.message 
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Log the deletion request for audit purposes
    console.log(`Data deletion requested for user: ${userId} at ${new Date().toISOString()}`)
    
    // Log security event
    logSubscriptionSecurityEvent(userId, 'data_deletion_requested', {
      timestamp: new Date().toISOString(),
      confirmation: confirmation
    })

    // Step 1: Get user's Stripe subscription and customer info before deletion
    let stripeCustomerId: string | null = null
    let stripeSubscriptionId: string | null = null
    
    try {
      const { data: subscriptionData } = await supabase
        .from('user_subscriptions')
        .select('stripe_subscription_id, stripe_customer_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (subscriptionData) {
        stripeSubscriptionId = subscriptionData.stripe_subscription_id
        stripeCustomerId = subscriptionData.stripe_customer_id
      }
    } catch (error) {
      console.log('No active subscription found for user:', userId)
    }

    // Step 2: Delete all user data in the correct order to handle foreign key constraints
    const deletionSteps = [
      {
        name: 'email_logs',
        query: async () => {
          // First get event IDs, then delete email logs
          const { data: eventIds } = await supabase
            .from('events')
            .select('id')
            .eq('user_id', userId)
          
          if (eventIds && eventIds.length > 0) {
            const eventIdArray = eventIds.map(e => e.id)
            return supabase
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
          // First get event IDs, then delete telegram logs
          const { data: eventIds } = await supabase
            .from('events')
            .select('id')
            .eq('user_id', userId)
          
          if (eventIds && eventIds.length > 0) {
            const eventIdArray = eventIds.map(e => e.id)
            return supabase
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
          // First get event IDs, then delete event contacts
          const { data: eventIds } = await supabase
            .from('events')
            .select('id')
            .eq('user_id', userId)
          
          if (eventIds && eventIds.length > 0) {
            const eventIdArray = eventIds.map(e => e.id)
            return supabase
              .from('event_contacts')
              .delete()
              .in('event_id', eventIdArray)
          }
          return { error: null }
        }
      },
      {
        name: 'transactions',
        query: () => supabase.from('transactions').delete().eq('user_id', userId)
      },
      {
        name: 'user_balances',
        query: () => supabase.from('user_balances').delete().eq('user_id', userId)
      },
      {
        name: 'user_subscriptions',
        query: () => supabase.from('user_subscriptions').delete().eq('user_id', userId)
      },
      {
        name: 'referrals',
        query: () => supabase.from('referrals').delete().eq('referrer_id', userId)
      },
      {
        name: 'contacts',
        query: () => supabase.from('contacts').delete().eq('user_id', userId)
      },
      {
        name: 'events',
        query: () => supabase.from('events').delete().eq('user_id', userId)
      }
    ]

    const deletionResults = []

    for (const step of deletionSteps) {
      try {
        const { error } = await step.query()
        if (error) {
          console.error(`Error deleting ${step.name}:`, error)
          deletionResults.push({ table: step.name, success: false, error: error.message })
        } else {
          deletionResults.push({ table: step.name, success: true })
        }
      } catch (error: any) {
        console.error(`Exception deleting ${step.name}:`, error)
        deletionResults.push({ table: step.name, success: false, error: error.message })
      }
    }

    // Check if all deletions were successful
    const failedDeletions = deletionResults.filter(result => !result.success)
    
    if (failedDeletions.length > 0) {
      console.error('Some data deletions failed:', failedDeletions)
      logSubscriptionSecurityEvent(userId, 'data_deletion_partial_failure', {
        failedDeletions,
        timestamp: new Date().toISOString()
      })
      return new NextResponse(
        JSON.stringify({ 
          error: 'Some data could not be deleted',
          failedDeletions 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Step 3: Cancel Stripe subscription if exists
    if (stripeSubscriptionId) {
      try {
        console.log(`Canceling Stripe subscription: ${stripeSubscriptionId}`)
        await stripe.subscriptions.cancel(stripeSubscriptionId)
        logSubscriptionSecurityEvent(userId, 'stripe_subscription_canceled', {
          subscriptionId: stripeSubscriptionId,
          timestamp: new Date().toISOString()
        })
        console.log(`Stripe subscription canceled: ${stripeSubscriptionId}`)
      } catch (error: any) {
        console.error('Error canceling Stripe subscription:', error)
        logSubscriptionSecurityEvent(userId, 'stripe_subscription_cancel_failed', {
          subscriptionId: stripeSubscriptionId,
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }
    }

    // Step 4: Delete Stripe customer if exists
    if (stripeCustomerId) {
      try {
        console.log(`Deleting Stripe customer: ${stripeCustomerId}`)
        await stripe.customers.del(stripeCustomerId)
        logSubscriptionSecurityEvent(userId, 'stripe_customer_deleted', {
          customerId: stripeCustomerId,
          timestamp: new Date().toISOString()
        })
        console.log(`Stripe customer deleted: ${stripeCustomerId}`)
      } catch (error: any) {
        console.error('Error deleting Stripe customer:', error)
        logSubscriptionSecurityEvent(userId, 'stripe_customer_delete_failed', {
          customerId: stripeCustomerId,
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }
    }

    // Step 5: Delete user from Supabase Auth using admin client
    let authDeletionSuccess = false
    try {
      console.log(`Deleting user from Supabase Auth: ${userId}`)
      
      // First, try to sign out all sessions for the user
      try {
        await supabaseAdmin.auth.admin.signOut(userId)
        console.log(`Signed out all sessions for user: ${userId}`)
      } catch (signOutError) {
        console.log('Could not sign out user sessions:', signOutError)
      }
      
      // Then try to delete the user
      const { data: { user: adminUser }, error: adminError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      
      if (adminError) {
        console.error('Error deleting user from Supabase Auth:', adminError)
        logSubscriptionSecurityEvent(userId, 'supabase_user_delete_failed', {
          error: adminError.message,
          timestamp: new Date().toISOString()
        })
        
        // If deletion fails, try to disable the user instead
        try {
          console.log(`Attempting to disable user instead: ${userId}`)
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { 
              deleted: true, 
              deleted_at: new Date().toISOString(),
              deletion_reason: 'user_requested_deletion'
            },
            email_confirm: false,
            phone_confirm: false
          })
          
          if (updateError) {
            console.error('Error disabling user:', updateError)
            logSubscriptionSecurityEvent(userId, 'supabase_user_disable_failed', {
              error: updateError.message,
              timestamp: new Date().toISOString()
            })
          } else {
            console.log(`User disabled successfully: ${userId}`)
            authDeletionSuccess = true
            logSubscriptionSecurityEvent(userId, 'supabase_user_disabled', {
              timestamp: new Date().toISOString()
            })
          }
        } catch (disableError: any) {
          console.error('Exception disabling user:', disableError)
          logSubscriptionSecurityEvent(userId, 'supabase_user_disable_exception', {
            error: disableError.message,
            timestamp: new Date().toISOString()
          })
        }
      } else {
        console.log(`User deleted from Supabase Auth: ${userId}`)
        authDeletionSuccess = true
        logSubscriptionSecurityEvent(userId, 'supabase_user_deleted', {
          timestamp: new Date().toISOString()
        })
      }
    } catch (error: any) {
      console.error('Exception deleting user from Supabase Auth:', error)
      logSubscriptionSecurityEvent(userId, 'supabase_user_delete_exception', {
        error: error.message,
        timestamp: new Date().toISOString()
      })
      
      // Try to disable the user as a fallback
      try {
        console.log(`Attempting to disable user as fallback: ${userId}`)
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { 
            deleted: true, 
            deleted_at: new Date().toISOString(),
            deletion_reason: 'user_requested_deletion_fallback'
          },
          email_confirm: false,
          phone_confirm: false
        })
        
        if (updateError) {
          console.error('Error disabling user as fallback:', updateError)
        } else {
          console.log(`User disabled as fallback: ${userId}`)
          authDeletionSuccess = true
          logSubscriptionSecurityEvent(userId, 'supabase_user_disabled_fallback', {
            timestamp: new Date().toISOString()
          })
        }
      } catch (fallbackError: any) {
        console.error('Exception in fallback user disable:', fallbackError)
        logSubscriptionSecurityEvent(userId, 'supabase_user_disable_fallback_exception', {
          error: fallbackError.message,
          timestamp: new Date().toISOString()
        })
      }
    }

    // Log successful complete deletion
    logSubscriptionSecurityEvent(userId, 'account_deletion_completed', {
      deletionResults,
      stripeSubscriptionCanceled: !!stripeSubscriptionId,
      stripeCustomerDeleted: !!stripeCustomerId,
      authDeletionSuccess,
      timestamp: new Date().toISOString()
    })
    
    console.log(`Complete account deletion successful for user: ${userId}`)

    return new NextResponse(
      JSON.stringify({ 
        message: authDeletionSuccess 
          ? 'Account and all associated data have been permanently deleted'
          : 'Account data has been deleted, but user account may still exist in authentication system',
        deletionResults,
        stripeSubscriptionCanceled: !!stripeSubscriptionId,
        stripeCustomerDeleted: !!stripeCustomerId,
        authDeletionSuccess,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error in data deletion:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to delete data' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 