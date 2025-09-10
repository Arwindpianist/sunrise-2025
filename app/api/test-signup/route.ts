import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json()

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
      return NextResponse.json({ 
        success: false, 
        error: authError.message,
        details: authError 
      }, { status: 400 })
    }

    if (!authData?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No user data returned from signup' 
      }, { status: 400 })
    }

    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check if user was created in public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    return NextResponse.json({
      success: true,
      authUser: {
        id: authData.user.id,
        email: authData.user.email,
        email_confirmed_at: authData.user.email_confirmed_at,
        created_at: authData.user.created_at
      },
      publicUser: userData,
      publicUserError: userError?.message || null
    })

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
