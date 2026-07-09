import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json()

    console.log('Starting detailed signup test for:', email)

    // Test signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ 
        success: false, 
        step: 'auth_signup',
        error: authError.message,
        details: authError 
      }, { status: 400 })
    }

    if (!authData?.user) {
      return NextResponse.json({ 
        success: false, 
        step: 'no_user_data',
        error: 'No user data returned from signup' 
      }, { status: 400 })
    }

    console.log('Auth signup successful, user ID:', authData.user.id)

    // Wait for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Check if user was created in public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    console.log('Public user query result:', { userData, userError })

    // Check if there are any recent users in the table
    const { data: recentUsers, error: recentError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    console.log('Recent users:', { recentUsers, recentError })

    return NextResponse.json({
      success: true,
      authUser: {
        id: authData.user.id,
        email: authData.user.email,
        email_confirmed_at: authData.user.email_confirmed_at,
        created_at: authData.user.created_at,
        user_metadata: authData.user.user_metadata
      },
      publicUser: userData,
      publicUserError: userError?.message || null,
      recentUsers: recentUsers,
      recentUsersError: recentError?.message || null
    })

  } catch (error: any) {
    console.error('Detailed test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        step: 'catch_block',
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
