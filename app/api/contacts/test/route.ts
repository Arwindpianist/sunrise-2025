import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
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

    // Test the database schema
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, phone, telegram_chat_id, category, notes, created_at')
      .eq('user_id', session.user.id)
      .limit(1)

    if (contactsError) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Database error', 
          details: contactsError.message,
          code: contactsError.code
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if telegram_chat_id column exists
    const hasTelegramColumn = contacts && contacts.length > 0 && 'telegram_chat_id' in contacts[0]

    return new NextResponse(
      JSON.stringify({
        message: 'Contacts API test successful',
        hasTelegramColumn,
        sampleContact: contacts && contacts.length > 0 ? contacts[0] : null,
        totalContacts: contacts?.length || 0
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error: any) {
    console.error('Error in contacts test:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 