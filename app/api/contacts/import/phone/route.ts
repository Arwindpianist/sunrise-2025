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
  telegram_chat_id?: string
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
  
  if (lines.length < 2) {
    return contacts
  }
  
  // Parse header row to find column indices
  const headerLine = lines[0]
  const headers = parseCSVRow(headerLine)
  
  // Find column indices for Google Contacts format
  const firstNameIndex = headers.findIndex(h => h === 'First Name') || headers.findIndex(h => h === 'Given Name')
  const lastNameIndex = headers.findIndex(h => h === 'Last Name') || headers.findIndex(h => h === 'Family Name')
  const emailIndex = headers.findIndex(h => h === 'E-mail 1 - Value')
  const phoneIndex = headers.findIndex(h => h === 'Phone 1 - Value')
  const notesIndex = headers.findIndex(h => h === 'Notes')
  const categoryIndex = headers.findIndex(h => h === 'Category')
  const telegramChatIdIndex = headers.findIndex(h => h === 'Telegram Chat ID')
  
  console.log('CSV Headers found:', {
    firstNameIndex,
    lastNameIndex,
    emailIndex,
    phoneIndex,
    notesIndex,
    categoryIndex,
    telegramChatIdIndex,
    headers: headers.slice(0, 10) // Log first 10 headers for debugging
  })
  
  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    
    const columns = parseCSVRow(line)
    
    if (columns.length > 0) {
      const rawPhone = columns[phoneIndex] || undefined
      const cleanedPhone = cleanPhoneNumber(rawPhone)
      
             const contact: ImportedContact = {
         first_name: firstNameIndex >= 0 ? columns[firstNameIndex] : 'Unknown',
         last_name: lastNameIndex >= 0 ? columns[lastNameIndex] : undefined,
         email: emailIndex >= 0 ? columns[emailIndex] : undefined,
         phone: phoneIndex >= 0 ? cleanedPhone : undefined,
         notes: notesIndex >= 0 ? columns[notesIndex] : undefined,
         category: categoryIndex >= 0 ? columns[categoryIndex] : undefined,
         telegram_chat_id: telegramChatIdIndex >= 0 ? columns[telegramChatIdIndex] : undefined,
       }
      
      // Only add contacts that have at least a first name or email
      if (contact.first_name !== 'Unknown' || contact.email) {
        contacts.push(contact)
      }
    }
  }
  
  return contacts
}

// Helper function to properly parse CSV rows (handles quoted fields with commas)
function parseCSVRow(row: string): string[] {
  const columns: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      columns.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // Add the last column
  columns.push(current.trim())
  
  // Remove quotes from the beginning and end of each column
  return columns.map(col => col.replace(/^"|"$/g, ''))
}

// Helper function to clean and extract the first phone number from multiple numbers
function cleanPhoneNumber(phoneString?: string): string | undefined {
  if (!phoneString) return undefined
  
  // Split by the Google Contacts separator " ::: "
  const phoneNumbers = phoneString.split(' ::: ')
  
  // Take the first phone number and clean it
  const firstPhone = phoneNumbers[0]?.trim()
  
  if (!firstPhone) return undefined
  
  // Remove any extra whitespace and normalize
  return firstPhone.replace(/\s+/g, ' ').trim()
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

    console.log('Parsed contacts:', contacts.slice(0, 3)) // Log first 3 contacts for debugging
    
    // Filter contacts that have required fields
    const validContacts = contacts.filter(contact => 
      contact.first_name && 
      contact.email // Email is required by database schema
    )

    console.log('Valid contacts:', validContacts.slice(0, 3)) // Log first 3 valid contacts
    console.log('Total contacts parsed:', contacts.length)
    console.log('Total valid contacts:', validContacts.length)

    if (validContacts.length === 0) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'No valid contacts found. All contacts must have an email address.',
          debug: {
            totalParsed: contacts.length,
            sampleContacts: contacts.slice(0, 3)
          }
        }),
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
      telegram_chat_id: contact.telegram_chat_id || null,
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
      
      console.log('Limit check result:', limitCheck)
      
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
        message: `Successfully imported ${insertedCount} contacts${duplicateCount > 0 ? ` (${duplicateCount} duplicates skipped)` : ''}`,
        imported: insertedCount,
        duplicates: duplicateCount,
        total: contacts.length,
        skipped: duplicateCount
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