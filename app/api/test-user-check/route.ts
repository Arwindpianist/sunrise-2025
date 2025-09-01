import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Get the email from query parameters instead of hardcoding
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return new NextResponse(JSON.stringify({ 
        error: 'Email parameter is required. Use ?email=user@example.com' 
      }), { status: 400 })
    }

    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', email)
      .limit(1)

    // Try to check auth.users if possible
    let authUserExists = false
    try {
      const { data: userCheck, error: userError } = await supabase
        .rpc('check_user_exists', { user_email: email })
      
      if (!userError && userCheck && userCheck.length > 0) {
        authUserExists = userCheck[0].user_exists
      }
    } catch (error) {
      console.log('Database function not available')
    }

    const result = {
      email,
      inUsersTable: users && users.length > 0,
      inAuthUsers: authUserExists,
      userData: users && users.length > 0 ? users[0] : null,
      isSunriseUser: (users && users.length > 0) || authUserExists
    }

    return new NextResponse(JSON.stringify({ result }), { status: 200 })

  } catch (error: any) {
    console.error('Error in test-user-check:', error)
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
