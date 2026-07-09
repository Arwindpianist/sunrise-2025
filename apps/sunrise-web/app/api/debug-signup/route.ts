import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json()

    console.log('Starting signup debug for:', email)

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

    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Check if user was created in public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    console.log('Public user query result:', { userData, userError })

    // Also check if the table exists and what's in it
    const { data: tableCheck, error: tableError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    console.log('Table check result:', { tableCheck, tableError })

    // Check if the trigger function exists
    const { data: functionCheck, error: functionError } = await supabase
      .rpc('handle_new_user', { new_user: authData.user })

    console.log('Function check result:', { functionCheck, functionError })

    return NextResponse.json({
      success: true,
      authUser: {
        id: authData.user.id,
        email: authData.user.email,
        email_confirmed_at: authData.user.email_confirmed_at,
        created_at: authData.user.created_at,
        raw_user_meta_data: authData.user.user_metadata
      },
      publicUser: userData,
      publicUserError: userError?.message || null,
      tableCheck: tableCheck,
      tableError: tableError?.message || null,
      functionCheck: functionCheck,
      functionError: functionError?.message || null
    })

  } catch (error: any) {
    console.error('Debug error:', error)
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
