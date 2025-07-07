import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface ImportedContact {
  first_name: string
  last_name?: string
  email?: string
  phone?: string
  category?: string
  notes?: string
}

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

    const body = await request.json()
    const { contacts, category } = body

    if (!contacts || !Array.isArray(contacts)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid contacts data' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (contacts.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'No contacts provided' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate and process contacts
    const validContacts = contacts.filter(contact => 
      contact.first_name && 
      (contact.email || contact.phone)
    )

    if (validContacts.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'No valid contacts found' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Prepare contacts for insertion
    const contactsToInsert = validContacts.map(contact => ({
      user_id: session.user.id,
      first_name: contact.first_name,
      last_name: contact.last_name || null,
      email: contact.email || null,
      phone: contact.phone || null,
      category: category || contact.category || 'other',
      notes: contact.notes || null,
    }))

    // Insert contacts in batches
    const batchSize = 100
    let insertedCount = 0
    let duplicateCount = 0

    for (let i = 0; i < contactsToInsert.length; i += batchSize) {
      const batch = contactsToInsert.slice(i, i + batchSize)
      
      const { error: insertError } = await supabase
        .from('contacts')
        .upsert(batch, {
          onConflict: 'user_id,email',
          ignoreDuplicates: false
        })

      if (insertError) {
        console.error('Error inserting contacts batch:', insertError)
        // Continue with other batches even if one fails
      } else {
        insertedCount += batch.length
      }
    }

    return new NextResponse(
      JSON.stringify({ 
        message: `Successfully imported ${insertedCount} contacts`,
        imported: insertedCount,
        duplicates: duplicateCount,
        total: validContacts.length
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error in native contact import:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 