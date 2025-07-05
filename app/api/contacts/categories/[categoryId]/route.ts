import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: Request,
  { params }: { params: { categoryId: string } }
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
    const { name, color } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return new NextResponse(
        JSON.stringify({ error: 'Category name is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if category exists and belongs to user
    const { data: existingCategory, error: fetchError } = await supabase
      .from('contact_categories')
      .select('*')
      .eq('id', params.categoryId)
      .eq('user_id', session.user.id)
      .single()

    if (fetchError || !existingCategory) {
      return new NextResponse(
        JSON.stringify({ error: 'Category not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Update category
    const { data: category, error: updateError } = await supabase
      .from('contact_categories')
      .update({
        name: name.trim(),
        color: color || existingCategory.color,
      })
      .eq('id', params.categoryId)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating category:', updateError)
      if (updateError.code === '23505') {
        return new NextResponse(
          JSON.stringify({ error: 'A category with this name already exists' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
      return new NextResponse(
        JSON.stringify({ error: 'Failed to update category' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new NextResponse(
      JSON.stringify(category),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error in category PUT:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { categoryId: string } }
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

    // Check if category exists and belongs to user
    const { data: existingCategory, error: fetchError } = await supabase
      .from('contact_categories')
      .select('*')
      .eq('id', params.categoryId)
      .eq('user_id', session.user.id)
      .single()

    if (fetchError || !existingCategory) {
      return new NextResponse(
        JSON.stringify({ error: 'Category not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Move contacts from this category to 'other'
    const { error: updateContactsError } = await supabase
      .from('contacts')
      .update({ category: 'other' })
      .eq('user_id', session.user.id)
      .eq('category', existingCategory.name)

    if (updateContactsError) {
      console.error('Error updating contacts:', updateContactsError)
    }

    // Delete the category
    const { error: deleteError } = await supabase
      .from('contact_categories')
      .delete()
      .eq('id', params.categoryId)
      .eq('user_id', session.user.id)

    if (deleteError) {
      console.error('Error deleting category:', deleteError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to delete category' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new NextResponse(
      JSON.stringify({ message: 'Category deleted successfully' }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error in category DELETE:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 