import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/google/callback'

export async function GET(request: Request) {
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

    // Generate state parameter for CSRF protection
    const state = session.user.id

    // Construct Google OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID)
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/contacts.readonly')
    authUrl.searchParams.append('access_type', 'offline')
    authUrl.searchParams.append('state', state)
    authUrl.searchParams.append('prompt', 'consent')

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Error in Google OAuth initiation:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
} 