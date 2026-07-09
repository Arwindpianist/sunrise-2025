import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { canCreateContact } from '@/lib/subscription-limits'

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
      contact.email // Email is required by database schema
    )

    const invalidContacts = contacts.filter(contact => 
      contact.first_name && 
      !contact.email // Contacts without email addresses
    )

    if (validContacts.length === 0) {
      const errorMessage = invalidContacts.length > 0 
        ? `No valid contacts found. All contacts must have an email address. Found ${invalidContacts.length} contacts without email addresses.`
        : 'No valid contacts found. All contacts must have an email address.'
      
      return new NextResponse(
        JSON.stringify({ 
          error: errorMessage,
          totalContacts: contacts.length,
          validContacts: validContacts.length,
          invalidContacts: invalidContacts.length,
          invalidContactExamples: invalidContacts.slice(0, 3).map(c => ({
            name: `${c.first_name} ${c.last_name || ''}`.trim(),
            phone: c.phone || 'No phone'
          }))
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Helper function to clean and extract the first phone number from multiple numbers
    const cleanPhoneNumber = (phoneString?: string): string | null => {
      if (!phoneString) return null
      
      // Split by the Google Contacts separator " ::: "
      const phoneNumbers = phoneString.split(' ::: ')
      
      // Take the first phone number and clean it
      const firstPhone = phoneNumbers[0]?.trim()
      
      if (!firstPhone) return null
      
      // Remove any extra whitespace and normalize
      return firstPhone.replace(/\s+/g, ' ').trim()
    }

    // Prepare contacts for insertion
    const contactsToInsert = validContacts.map(contact => ({
      user_id: session.user.id,
      first_name: contact.first_name,
      last_name: contact.last_name || null,
      email: contact.email, // Email is required
      phone: cleanPhoneNumber(contact.phone) || null,
      category: category || contact.category || 'other',
      notes: contact.notes || null,
    }))

    // Remove duplicates within the batch (same email addresses)
    const uniqueContacts = contactsToInsert.filter((contact, index, self) => 
      index === self.findIndex(c => c.email?.toLowerCase() === contact.email?.toLowerCase())
    )

    // Check for existing contacts in database to avoid conflicts
    const existingEmails = await supabase
      .from('contacts')
      .select('email')
      .eq('user_id', session.user.id)
      .in('email', uniqueContacts.map(c => c.email?.toLowerCase()).filter(Boolean))

    const existingEmailSet = new Set(
      existingEmails.data?.map(row => row.email.toLowerCase()) || []
    )

    // Filter out contacts that already exist
    const newContacts = uniqueContacts.filter(contact => 
      contact.email && !existingEmailSet.has(contact.email.toLowerCase())
    )

    const duplicateCount = uniqueContacts.length - newContacts.length

    // Check contact creation limit before importing
    if (newContacts.length > 0) {
      const limitCheck = await canCreateContact()
      
      if (!limitCheck.allowed) {
        const limitInfo = limitCheck.maxAllowed === -1 ? 'unlimited' : limitCheck.maxAllowed
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
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      // Check if importing these contacts would exceed the limit
      if (limitCheck.maxAllowed !== -1 && (limitCheck.currentCount + newContacts.length) > limitCheck.maxAllowed) {
        const canImport = limitCheck.maxAllowed - limitCheck.currentCount
        return new NextResponse(
          JSON.stringify({ 
            error: `Import would exceed contact limit. You can only import ${canImport} more contacts.`,
            limitReached: true,
            currentCount: limitCheck.currentCount,
            maxAllowed: limitCheck.maxAllowed,
            canImport
          }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Insert contacts in batches
    const batchSize = 100
    let insertedCount = 0

    for (let i = 0; i < newContacts.length; i += batchSize) {
      const batch = newContacts.slice(i, i + batchSize)
      
      if (batch.length > 0) {
        const { error: insertError } = await supabase
          .from('contacts')
          .insert(batch)

        if (insertError) {
          console.error('Error inserting contacts batch:', insertError)
          // Continue with other batches even if one fails
        } else {
          insertedCount += batch.length
        }
      }
    }

    return new NextResponse(
      JSON.stringify({ 
        message: `Successfully imported ${insertedCount} contacts${duplicateCount > 0 ? ` (${duplicateCount} duplicates skipped)` : ''}${invalidContacts.length > 0 ? ` (${invalidContacts.length} contacts without email addresses skipped)` : ''}`,
        imported: insertedCount,
        duplicates: duplicateCount,
        total: contacts.length,
        validContacts: validContacts.length,
        invalidContacts: invalidContacts.length,
        skipped: duplicateCount + invalidContacts.length,
        summary: {
          totalProcessed: contacts.length,
          validWithEmail: validContacts.length,
          invalidWithoutEmail: invalidContacts.length,
          duplicatesSkipped: duplicateCount,
          successfullyImported: insertedCount
        }
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