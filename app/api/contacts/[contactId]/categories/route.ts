import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export const dynamic = 'force-dynamic'

// Get all categories for a specific contact
export async function GET(
  request: Request,
  { params }: { params: { contactId: string } }
) {
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

    // Get contact to verify ownership
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, user_id')
      .eq('id', params.contactId)
      .single()

    if (contactError || !contact) {
      return new NextResponse(
        JSON.stringify({ error: 'Contact not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (contact.user_id !== session.user.id) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Get all categories assigned to this contact
    const { data: assignments, error: assignmentsError } = await supabase
      .from('contact_category_assignments')
      .select(`
        category_id,
        contact_categories (
          id,
          name,
          color
        )
      `)
      .eq('contact_id', params.contactId)

    if (assignmentsError) {
      console.error('Error fetching category assignments:', assignmentsError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch category assignments' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Transform the data to a cleaner format
    const categories = assignments?.map(assignment => assignment.contact_categories).filter(Boolean) || []

    return new NextResponse(
      JSON.stringify(categories),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error in contact categories GET:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

// Add categories to a contact
export async function POST(
  request: Request,
  { params }: { params: { contactId: string } }
) {
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
    const { categoryIds } = body

    if (!Array.isArray(categoryIds)) {
      return new NextResponse(
        JSON.stringify({ error: 'categoryIds must be an array' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Get contact to verify ownership
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, user_id')
      .eq('id', params.contactId)
      .single()

    if (contactError || !contact) {
      return new NextResponse(
        JSON.stringify({ error: 'Contact not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (contact.user_id !== session.user.id) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify all categories belong to the user
    const { data: categories, error: categoriesError } = await supabase
      .from('contact_categories')
      .select('id')
      .eq('user_id', session.user.id)
      .in('id', categoryIds)

    if (categoriesError) {
      console.error('Error verifying categories:', categoriesError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to verify categories' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (categories.length !== categoryIds.length) {
      return new NextResponse(
        JSON.stringify({ error: 'Some categories not found or do not belong to user' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Remove existing assignments for this contact
    const { error: deleteError } = await supabase
      .from('contact_category_assignments')
      .delete()
      .eq('contact_id', params.contactId)

    if (deleteError) {
      console.error('Error removing existing assignments:', deleteError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to update category assignments' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Add new assignments
    if (categoryIds.length > 0) {
      const assignments = categoryIds.map(categoryId => ({
        contact_id: params.contactId,
        category_id: categoryId
      }))

      const { error: insertError } = await supabase
        .from('contact_category_assignments')
        .insert(assignments)

      if (insertError) {
        console.error('Error inserting new assignments:', insertError)
        return new NextResponse(
          JSON.stringify({ error: 'Failed to update category assignments' }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    }

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Categories updated successfully' }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error in contact categories POST:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
