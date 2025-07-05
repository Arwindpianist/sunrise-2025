import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { userId } = params

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // First try to get the user profile from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profile && !profileError) {
      return new NextResponse(
        JSON.stringify(profile),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // If no profile found, try to get basic user info from auth.users
    // Note: This requires admin privileges, so we'll use a different approach
    // For now, return a basic user object with the ID
    const basicUser = {
      id: userId,
      first_name: null,
      last_name: null,
      full_name: null,
      email: null,
    }

    return new NextResponse(
      JSON.stringify(basicUser),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error fetching user:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 