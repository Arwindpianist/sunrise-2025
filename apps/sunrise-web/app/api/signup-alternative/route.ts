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

    // Create user in auth.users table directly
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
      console.error('Auth error:', authError)
      return NextResponse.json({ 
        success: false, 
        error: authError.message 
      }, { status: 400 })
    }

    if (!authData?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No user data returned' 
      }, { status: 400 })
    }

    // Manually create user record in public.users table
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
      console.error('User creation error:', userError)
      // Don't fail the signup if user creation fails
      // The auth user was created successfully
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
      userRecord: userData?.[0],
      message: 'User created successfully'
    })

  } catch (error: any) {
    console.error('Signup error:', error)
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
