import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Check if user is authenticated and is admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Check if user is admin
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('subscription_plan')
      .eq('id', session.user.id)
      .single()

    if (userError || userProfile?.subscription_plan !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }

    // Get user enquiries from database
    const { data: enquiries, error: enquiriesError } = await supabase
      .from('user_enquiries')
      .select(`
        id,
        user_id,
        subject,
        message,
        status,
        priority,
        category,
        admin_notes,
        created_at,
        updated_at,
        users!inner(email, full_name)
      `)
      .order('created_at', { ascending: false })

    if (enquiriesError) {
      console.error('Error fetching enquiries:', enquiriesError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch enquiries' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Format the enquiries data
    const formattedEnquiries = enquiries?.map(enquiry => ({
      id: enquiry.id,
      user_id: enquiry.user_id,
      user_email: (enquiry.users as any)?.email || 'Unknown',
      user_name: (enquiry.users as any)?.full_name || 'Unknown User',
      subject: enquiry.subject,
      message: enquiry.message,
      status: enquiry.status,
      priority: enquiry.priority,
      category: enquiry.category,
      admin_notes: enquiry.admin_notes,
      created_at: enquiry.created_at,
      updated_at: enquiry.updated_at
    })) || []

    return new NextResponse(JSON.stringify(formattedEnquiries), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Error fetching enquiries:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 