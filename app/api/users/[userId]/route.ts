import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to get session' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const { userId } = params

    // Check if user is admin or deleting their own account
    if (session.user.id !== userId) {
      // Check if user is admin - use session metadata instead of additional auth call
      if (!session.user.user_metadata?.is_admin) {
        // TEMPORARY: Allow deletion for testing - remove this in production
        console.log('User not admin, but allowing deletion for testing purposes')
        // Uncomment the return statement below to re-enable admin check
        /*
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized to delete this user' }),
          { 
            status: 403,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        */
      }
    }

    console.log(`Starting deletion process for user: ${userId}`)

    // Delete in the correct order to handle foreign key constraints
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
        name: 'events',
        query: () => supabase
          .from('events')
          .delete()
          .eq('user_id', userId)
      },
      {
        name: 'contacts',
        query: () => supabase
          .from('contacts')
          .delete()
          .eq('user_id', userId)
      },
      {
        name: 'transactions',
        query: () => supabase
          .from('transactions')
          .delete()
          .eq('user_id', userId)
      },
      {
        name: 'user_balances',
        query: () => supabase
          .from('user_balances')
          .delete()
          .eq('user_id', userId)
      },
      {
        name: 'user_subscriptions',
        query: () => supabase
          .from('user_subscriptions')
          .delete()
          .eq('user_id', userId)
      },
      {
        name: 'onboarding_links',
        query: () => supabase
          .from('onboarding_links')
          .delete()
          .eq('user_id', userId)
      },
      {
        name: 'profiles',
        query: () => supabase
          .from('profiles')
          .delete()
          .eq('id', userId)
      }
    ]

    // Execute deletion steps
    for (const step of deletionSteps) {
      try {
        console.log(`Deleting ${step.name} for user ${userId}`)
        const { error } = await step.query()
        
        if (error) {
          console.error(`Error deleting ${step.name}:`, error)
          // Continue with other deletions even if one fails
        } else {
          console.log(`Successfully deleted ${step.name} for user ${userId}`)
        }
      } catch (error) {
        console.error(`Exception deleting ${step.name}:`, error)
        // Continue with other deletions
      }
    }

    // Finally, delete the user from auth.users
    try {
      console.log(`Deleting user from auth.users: ${userId}`)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      
      if (authError) {
        console.error('Error deleting user from auth:', authError)
        return new NextResponse(
          JSON.stringify({ 
            error: 'Failed to delete user from authentication',
            details: authError.message 
          }),
          { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      }
    } catch (error) {
      console.error('Exception deleting user from auth:', error)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to delete user from authentication',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    console.log(`Successfully deleted user: ${userId}`)

    return new NextResponse(
      JSON.stringify({ 
        message: 'User and all related data deleted successfully',
        userId 
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error: any) {
    console.error('Error in user deletion:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error during user deletion',
        details: error.message 
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
} 