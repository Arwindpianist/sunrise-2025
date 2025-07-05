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

    // Get user_id from query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    // If no session but we have a user_id, allow fetching categories for that user
    // This is needed for the contact form
    if (!session && !userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const targetUserId = userId || session?.user.id

    if (!targetUserId) {
      return new NextResponse(
        JSON.stringify({ error: 'No user ID provided' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Get user's contact categories
    const { data: categories, error: categoriesError } = await supabase
      .from('contact_categories')
      .select('*')
      .eq('user_id', targetUserId)
      .order('name', { ascending: true })

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch categories' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new NextResponse(
      JSON.stringify(categories || []),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error in categories GET:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
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

    // Create category
    const { data: category, error: categoryError } = await supabase
      .from('contact_categories')
      .insert([
        {
          user_id: session.user.id,
          name: name.trim(),
          color: color || '#6B7280',
        },
      ])
      .select()
      .single()

    if (categoryError) {
      console.error('Error creating category:', categoryError)
      if (categoryError.code === '23505') {
        return new NextResponse(
          JSON.stringify({ error: 'A category with this name already exists' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
      return new NextResponse(
        JSON.stringify({ error: 'Failed to create category' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new NextResponse(
      JSON.stringify(category),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error in categories POST:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 