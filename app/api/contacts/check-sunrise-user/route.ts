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

    // Check if the email exists in the auth.users table
    const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(email)

    if (userError) {
      console.error('Error checking user:', userError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to check user status' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const isSunriseUser = !!user.user

    return new NextResponse(
      JSON.stringify({ 
        isSunriseUser,
        userId: user.user?.id || null,
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
