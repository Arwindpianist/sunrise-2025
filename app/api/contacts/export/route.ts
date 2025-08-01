import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'simple'

    // Fetch all contacts for the user
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError)
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch contacts" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    if (!contacts || contacts.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: "No contacts found" }),
        { 
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    let csvContent: string
    let filename: string

    if (format === 'google') {
      // Google Contacts format
      const headers = [
        'Name',
        'Given Name',
        'Family Name',
        'E-mail 1 - Value',
        'Phone 1 - Value',
        'Notes',
        'Group Membership'
      ]

      csvContent = [
        headers.join(','),
        ...contacts.map(contact => [
          `"${contact.first_name} ${contact.last_name || ''}".trim()`,
          `"${contact.first_name || ''}"`,
          `"${contact.last_name || ''}"`,
          `"${contact.email || ''}"`,
          `"${contact.phone || ''}"`,
          `"${contact.notes || ''}"`,
          '"* My Contacts"'
        ].join(','))
      ].join('\n')

      filename = `google-contacts-${new Date().toISOString().split('T')[0]}.csv`
    } else {
      // Simple CSV format
      const headers = [
        'First Name',
        'Last Name', 
        'E-mail 1 - Value',
        'Phone 1 - Value',
        'Notes',
        'Category',
        'Created At'
      ]

      csvContent = [
        headers.join(','),
        ...contacts.map(contact => [
          `"${contact.first_name || ''}"`,
          `"${contact.last_name || ''}"`,
          `"${contact.email || ''}"`,
          `"${contact.phone || ''}"`,
          `"${contact.notes || ''}"`,
          `"${contact.category || ''}"`,
          `"${contact.created_at || ''}"`
        ].join(','))
      ].join('\n')

      filename = `sunrise-contacts-${new Date().toISOString().split('T')[0]}.csv`
    }

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error: any) {
    console.error("Error exporting contacts:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
