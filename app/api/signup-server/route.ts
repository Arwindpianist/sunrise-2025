import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and password are required' 
      }, { status: 400 })
    }

    // Step 1: Try to sign up using server-side Supabase client
    console.log('Attempting server-side signup for:', email)
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://sunrise-2025.com'}/auth/callback`,
      },
    })

    if (authError) {
      console.error('Server-side auth signup failed:', authError)
      return NextResponse.json({ 
        success: false, 
        error: authError.message,
        details: authError
      }, { status: 400 })
    }

    if (!authData?.user) {
      console.error('No user data returned from server-side signup')
      return NextResponse.json({ 
        success: false, 
        error: 'No user data returned from signup' 
      }, { status: 400 })
    }

    console.log('Server-side signup successful for user:', authData.user.id)

    // Step 2: Manually create user record in public.users
    console.log('Creating user record in public.users table')
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName || '',
        subscription_plan: 'free',
        token_balance: 0,
        created_at: authData.user.created_at,
        updated_at: authData.user.created_at
      })
      .select()

    if (userError) {
      console.error('Failed to create user record:', userError)
      // Don't fail the signup if user creation fails
      // The auth user was created successfully
    } else {
      console.log('User record created successfully:', userData[0])
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
      userRecord: userData?.[0],
      message: 'User created successfully via server-side signup'
    })

  } catch (error: any) {
    console.error('Server-side signup error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Server-side signup failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
