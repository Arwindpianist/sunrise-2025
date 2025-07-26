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
        updated_at
      `)
      .order('created_at', { ascending: false })

    if (enquiriesError) {
      console.error('Error fetching enquiries:', enquiriesError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch enquiries', details: enquiriesError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get user details for the enquiries
    const userIds = enquiries?.map(e => e.user_id).filter(Boolean) || []
    let userDetails: any = {}
    
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', userIds)
      
      if (!usersError && users) {
        userDetails = users.reduce((acc, user) => {
          acc[user.id] = user
          return acc
        }, {} as any)
      }
    }

    // Format the enquiries data
    const formattedEnquiries = enquiries?.map(enquiry => {
      const user = userDetails[enquiry.user_id]
      return {
        id: enquiry.id,
        user_id: enquiry.user_id,
        user_email: user?.email || 'Unknown',
        user_name: user?.full_name || 'Unknown User',
        subject: enquiry.subject,
        message: enquiry.message,
        status: enquiry.status,
        priority: enquiry.priority,
        category: enquiry.category,
        admin_notes: enquiry.admin_notes,
        created_at: enquiry.created_at,
        updated_at: enquiry.updated_at
      }
    }) || []

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