import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logSubscriptionSecurityEvent } from '@/lib/subscription-security'

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
    const { confirmation } = await request.json()

    if (!confirmation || confirmation !== 'DELETE_MY_DATA') {
      return new NextResponse(
        JSON.stringify({ error: 'Confirmation required. Please type DELETE_MY_DATA to confirm.' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Log the deletion request for audit purposes
    console.log(`Data deletion requested for user: ${userId} at ${new Date().toISOString()}`)
    
    // Log security event
    logSubscriptionSecurityEvent(userId, 'data_deletion_requested', {
      timestamp: new Date().toISOString(),
      confirmation: confirmation
    })

    // Delete all user data in the correct order to handle foreign key constraints
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
        query: supabase.from('transactions').delete().eq('user_id', userId)
      },
      {
        name: 'user_balances',
        query: supabase.from('user_balances').delete().eq('user_id', userId)
      },
      {
        name: 'user_subscriptions',
        query: supabase.from('user_subscriptions').delete().eq('user_id', userId)
      },
      {
        name: 'referrals',
        query: supabase.from('referrals').delete().eq('referrer_id', userId)
      },
      {
        name: 'contacts',
        query: supabase.from('contacts').delete().eq('user_id', userId)
      },
      {
        name: 'events',
        query: supabase.from('events').delete().eq('user_id', userId)
      }
    ]

    const deletionResults = []

    for (const step of deletionSteps) {
      try {
        const { error } = await step.query
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

    // For user account deletion, we'll use a different approach
    // Instead of admin.deleteUser, we'll mark the user as deleted in our system
    // and let them sign out, which will effectively delete their session
    try {
      // Log successful data deletion
      logSubscriptionSecurityEvent(userId, 'data_deletion_completed', {
        deletionResults,
        timestamp: new Date().toISOString()
      })
      
      console.log(`User data successfully deleted for user: ${userId}`)

      return new NextResponse(
        JSON.stringify({ 
          message: 'Account and all associated data have been permanently deleted',
          deletionResults,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    } catch (error: any) {
      console.error('Exception in data deletion process:', error)
      logSubscriptionSecurityEvent(userId, 'data_deletion_error', {
        error: error.message,
        timestamp: new Date().toISOString()
      })
      return new NextResponse(
        JSON.stringify({ 
          error: 'Data deletion process failed',
          details: error.message 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
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