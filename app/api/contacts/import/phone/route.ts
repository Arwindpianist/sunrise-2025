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

function parseVCard(vcardContent: string): ImportedContact[] {
  const contacts: ImportedContact[] = []
  const vcards = vcardContent.split('BEGIN:VCARD')
  
  for (const vcard of vcards) {
    if (!vcard.trim()) continue
    
    const lines = vcard.split('\n')
    let contact: ImportedContact = { first_name: 'Unknown' }
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      if (trimmedLine.startsWith('FN:')) {
        const fullName = trimmedLine.substring(3).replace(/\\/g, '')
        const nameParts = fullName.split(' ')
        contact.first_name = nameParts[0] || 'Unknown'
        contact.last_name = nameParts.slice(1).join(' ') || undefined
      }
      
      if (trimmedLine.startsWith('N:')) {
        const nameData = trimmedLine.substring(2).replace(/\\/g, '').split(';')
        if (nameData.length >= 2) {
          contact.last_name = nameData[0] || undefined
          contact.first_name = nameData[1] || 'Unknown'
        }
      }
      
      if (trimmedLine.startsWith('EMAIL:')) {
        contact.email = trimmedLine.substring(6).replace(/\\/g, '')
      }
      
      if (trimmedLine.startsWith('TEL:')) {
        contact.phone = trimmedLine.substring(4).replace(/\\/g, '')
      }
      
      if (trimmedLine.startsWith('NOTE:')) {
        contact.notes = trimmedLine.substring(5).replace(/\\/g, '')
      }
    }
    
    if (contact.first_name !== 'Unknown' || contact.email || contact.phone) {
      contacts.push(contact)
    }
  }
  
  return contacts
}

function parseCSV(csvContent: string): ImportedContact[] {
  const contacts: ImportedContact[] = []
  const lines = csvContent.split('\n')
  
  // Skip header row
  const dataLines = lines.slice(1)
  
  for (const line of dataLines) {
    if (!line.trim()) continue
    
    const columns = line.split(',').map(col => col.trim().replace(/"/g, ''))
    
    if (columns.length >= 2) {
      const contact: ImportedContact = {
        first_name: columns[0] || 'Unknown',
        last_name: columns[1] || undefined,
        email: columns[2] || undefined,
        phone: columns[3] || undefined,
        category: columns[4] || undefined,
        notes: columns[5] || undefined,
      }
      
      if (contact.first_name !== 'Unknown' || contact.email || contact.phone) {
        contacts.push(contact)
      }
    }
  }
  
  return contacts
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string

    if (!file) {
      return new NextResponse(
        JSON.stringify({ error: 'No file provided' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const fileContent = await file.text()
    let contacts: ImportedContact[] = []

    // Determine file type and parse accordingly
    if (file.name.toLowerCase().endsWith('.vcf') || fileContent.includes('BEGIN:VCARD')) {
      contacts = parseVCard(fileContent)
    } else if (file.name.toLowerCase().endsWith('.csv') || fileContent.includes(',')) {
      contacts = parseCSV(fileContent)
    } else {
      return new NextResponse(
        JSON.stringify({ error: 'Unsupported file format. Please upload a .vcf or .csv file.' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (contacts.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'No valid contacts found in the file' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Filter contacts that have required fields
    const validContacts = contacts.filter(contact => 
      contact.first_name && 
      contact.email // Email is required by database schema
    )

    if (validContacts.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'No valid contacts found. All contacts must have an email address.' }),
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
      email: contact.email, // Email is required
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
        total: contacts.length
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error in phone import:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 