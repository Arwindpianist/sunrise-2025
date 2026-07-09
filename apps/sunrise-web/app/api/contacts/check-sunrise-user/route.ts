import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
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

    const { email } = await request.json()

    if (!email) {
      return new NextResponse(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // First try to use the database function if it exists
    let isSunriseUser = false
    let userId = null

    try {
      const { data: userCheck, error: userError } = await supabase
        .rpc('check_user_exists', { user_email: email })

      if (!userError && userCheck && userCheck.length > 0) {
        isSunriseUser = userCheck[0].user_exists
        userId = userCheck[0].user_id
      }
    } catch (error) {
      console.log('Database function not available, trying alternative approach')
    }

    // Fallback: Check the users table for profile data
    if (!isSunriseUser) {
      try {
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', email)
          .limit(1)

        if (!userError && users && users.length > 0) {
          isSunriseUser = true
          userId = users[0].id
        }
      } catch (error) {
        console.error('Error checking users table:', error)
      }
    }

    console.log(`Checking Sunrise user for ${email}: ${isSunriseUser ? 'Found' : 'Not found'}`)

    return new NextResponse(
      JSON.stringify({ 
        isSunriseUser,
        userId: userId,
        email: email
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error: any) {
    console.error('Error in check-sunrise-user:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
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
