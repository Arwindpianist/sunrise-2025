import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { canCreateContact } from '@/lib/subscription-limits'

export const dynamic = 'force-dynamic'

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

    // Get contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch contacts' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    return new NextResponse(
      JSON.stringify(contacts),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('Error in contacts:', error)
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

export async function POST(request: Request) {
  try {
    console.log('=== CONTACTS API START ===')
    
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the session (optional for public contact forms)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Session check:', { hasSession: !!session, sessionError })

    const body = await request.json()
    console.log('Request body:', body)
    
    const { first_name, last_name, email, phone, telegram_chat_id, category, notes, user_id } = body

    // Determine the user_id - either from session or from the form (for public contact forms)
    let targetUserId: string
    if (user_id) {
      // Public contact form submission
      targetUserId = user_id
      console.log('Public contact form submission for user:', targetUserId)
    } else if (session?.user?.id) {
      // Authenticated user submission
      targetUserId = session.user.id
      console.log('Authenticated user submission for user:', targetUserId)
    } else {
      console.log('No user context provided')
      return new NextResponse(
        JSON.stringify({ error: 'No user context provided for contact submission' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Validate required fields
    if (!first_name || !email) {
      console.log('Validation failed: missing first_name or email')
      return new NextResponse(
        JSON.stringify({ error: 'Full name and email are required' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('Validation failed: invalid email format')
      return new NextResponse(
        JSON.stringify({ error: 'Please enter a valid email address' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Validate telegram_chat_id if provided (should be numeric)
    if (telegram_chat_id && !/^\d+$/.test(telegram_chat_id)) {
      console.log('Validation failed: invalid telegram_chat_id')
      return new NextResponse(
        JSON.stringify({ error: 'Telegram Chat ID should be a number' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Check contact creation limit (only for authenticated users, not public forms)
    if (session?.user?.id && !user_id) {
      console.log('Checking contact limits for authenticated user')
      const limitCheck = await canCreateContact()
      
      if (!limitCheck.allowed) {
        const limitInfo = limitCheck.maxAllowed === -1 ? 'unlimited' : limitCheck.maxAllowed
        console.log('Contact limit reached')
        return new NextResponse(
          JSON.stringify({ 
            error: `Contact limit reached. You can only create up to ${limitInfo} contacts with your current plan.`,
            limitReached: true,
            currentCount: limitCheck.currentCount,
            maxAllowed: limitCheck.maxAllowed,
            tier: limitCheck.tier
          }),
          { 
            status: 403,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      }
    }

    // For public contact forms, use the existing client but ensure proper RLS policies
    let supabaseClient = supabase
    if (!session && user_id) {
      console.log('Using existing client for public contact form - RLS policies should allow this')
    }

    console.log('About to insert contact with data:', {
      user_id: targetUserId,
      first_name,
      last_name,
      email,
      phone,
      telegram_chat_id,
      category,
      notes,
    })

    // Create contact
    const { data: contact, error: contactError } = await supabaseClient
      .from('contacts')
      .insert([
        {
          user_id: targetUserId,
          first_name,
          last_name,
          email,
          phone,
          telegram_chat_id,
          category,
          notes,
        },
      ])
      .select()
      .single()

    console.log('Supabase response:', { contact, contactError })

    if (contactError) {
      console.error('Error creating contact:', contactError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to create contact', details: contactError.message }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    if (!contact) {
      console.error('No contact data returned')
      return new NextResponse(
        JSON.stringify({ error: 'Contact was not created' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    console.log('Contact created successfully:', contact)
    console.log('=== CONTACTS API END ===')

    return new NextResponse(
      JSON.stringify({
        success: true,
        contact,
        message: 'Contact created successfully'
      }),
      { 
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('=== CONTACTS API ERROR ===')
    console.error('Error in contacts:', error)
    console.error('Error stack:', error.stack)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
} 