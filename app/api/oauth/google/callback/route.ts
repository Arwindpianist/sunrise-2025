import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/google/callback'

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error('Session error:', sessionError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=session_expired`
      )
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      console.error('Missing parameters:', { code, state })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/contacts?error=missing_parameters`
      )
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Token exchange error:', errorData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/contacts?error=token_exchange_failed`
      )
    }

    const tokens = await tokenResponse.json()

    // Fetch contacts from Google People API
    const contactsResponse = await fetch(
      'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    )

    if (!contactsResponse.ok) {
      const errorData = await contactsResponse.json()
      console.error('Contacts fetch error:', errorData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/contacts?error=contacts_fetch_failed`
      )
    }

    const contactsData = await contactsResponse.json()

    // Process and store contacts
    const contacts = contactsData.connections
      ?.filter((contact: any) => contact.emailAddresses && contact.emailAddresses.length > 0)
      .map((contact: any) => ({
        user_id: session.user.id, // Use the actual user ID from session
        first_name: contact.names?.[0]?.givenName || 'Unknown',
        last_name: contact.names?.[0]?.familyName || '',
        email: contact.emailAddresses[0].value,
        category: 'other'
      })) || []

    if (contacts.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/contacts?imported=0`
      )
    }

    // Insert contacts in batches to avoid hitting limits
    const batchSize = 100
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize)
      const { error: insertError } = await supabase
        .from('contacts')
        .upsert(batch, {
          onConflict: 'user_id,email',
          ignoreDuplicates: true
        })

      if (insertError) {
        console.error('Error inserting contacts:', insertError)
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/contacts?error=insert_failed`
        )
      }
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/contacts?imported=${contacts.length}`
    )
  } catch (error: any) {
    console.error('Callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/contacts?error=internal_error`
    )
  }
} 