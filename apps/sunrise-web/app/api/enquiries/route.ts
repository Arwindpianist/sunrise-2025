import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return new NextResponse(
        JSON.stringify({ error: 'Authentication error', details: sessionError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - No session found' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('User authenticated:', session.user.id)

    const body = await request.json()
    const { subject, message, category, priority } = body

    console.log('Request body:', { subject, message, category, priority })

    // Validate required fields
    if (!subject?.trim() || !message?.trim() || !category || !priority) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Missing required fields',
          received: { subject: !!subject, message: !!message, category: !!category, priority: !!priority }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if user exists in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', session.user.id)
      .single()

    if (userError) {
      console.error('User lookup error:', userError)
      return new NextResponse(
        JSON.stringify({ error: 'User not found in database', details: userError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('User found in database:', userData.id)

    // Insert the enquiry
    const insertData = {
      user_id: session.user.id,
      subject: subject.trim(),
      message: message.trim(),
      category,
      priority,
      status: 'open'
    }

    console.log('Inserting enquiry data:', insertData)

    const { data: enquiry, error } = await supabase
      .from('user_enquiries')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating enquiry:', error)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to create enquiry', 
          details: error,
          code: error.code,
          message: error.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('Enquiry created successfully:', enquiry.id)

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
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 