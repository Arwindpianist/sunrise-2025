import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: Request,
  { params }: { params: { contactId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the contact data from the request
    const contactData = await request.json()
    
    // Validate required fields
    if (!contactData.first_name || !contactData.last_name || !contactData.email) {
      return NextResponse.json(
        { message: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    // Check if the contact exists and belongs to the user
    const { data: existingContact, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', params.contactId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingContact) {
      return NextResponse.json(
        { message: 'Contact not found' },
        { status: 404 }
      )
    }

    // Check if the new email is already used by another contact
    if (contactData.email !== existingContact.email) {
      const { data: duplicateContact, error: duplicateError } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', user.id)
        .eq('email', contactData.email)
        .neq('id', params.contactId)
        .single()

      if (duplicateContact) {
        return NextResponse.json(
          { message: 'A contact with this email already exists' },
          { status: 400 }
        )
      }
    }

    // Update the contact
    const { data: updatedContact, error: updateError } = await supabase
      .from('contacts')
      .update({
        first_name: contactData.first_name,
        last_name: contactData.last_name,
        email: contactData.email,
        phone: contactData.phone || null,
        telegram_chat_id: contactData.telegram_chat_id || null,
        category: contactData.category || 'other',
        notes: contactData.notes || null,
      })
      .eq('id', params.contactId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating contact:', updateError)
      return NextResponse.json(
        { message: 'Failed to update contact' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedContact)
  } catch (error) {
    console.error('Error in PUT /api/contacts/[contactId]:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { contactId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if the contact exists and belongs to the user
    const { data: existingContact, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', params.contactId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingContact) {
      return NextResponse.json(
        { message: 'Contact not found' },
        { status: 404 }
      )
    }

    // Delete the contact
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', params.contactId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting contact:', deleteError)
      return NextResponse.json(
        { message: 'Failed to delete contact' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Contact deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/contacts/[contactId]:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 