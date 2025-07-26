import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const body = await request.json()
    const { subject, message, category, priority } = body

    // Validate required fields
    if (!subject?.trim() || !message?.trim() || !category || !priority) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Insert the enquiry
    const { data: enquiry, error } = await supabase
      .from('user_enquiries')
      .insert({
        user_id: session.user.id,
        subject: subject.trim(),
        message: message.trim(),
        category,
        priority,
        status: 'open'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating enquiry:', error)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to create enquiry', details: error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new NextResponse(JSON.stringify({
      message: 'Enquiry submitted successfully',
      enquiry
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Error in enquiries API:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 