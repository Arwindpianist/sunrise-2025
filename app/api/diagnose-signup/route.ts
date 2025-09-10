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

    const results = {
      step: 'starting',
      authSignup: null,
      authError: null,
      userExists: null,
      publicUserExists: null,
      manualUserCreation: null,
      manualUserError: null
    }

    // Step 1: Try to sign up
    console.log('Step 1: Attempting auth signup')
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

    results.step = 'auth_signup_completed'
    results.authSignup = authData
    results.authError = authError

    if (authError) {
      console.log('Auth signup failed:', authError.message)
      return NextResponse.json({
        success: false,
        step: 'auth_signup_failed',
        error: authError.message,
        details: authError,
        results
      })
    }

    if (!authData?.user) {
      console.log('No user data returned from signup')
      return NextResponse.json({
        success: false,
        step: 'no_user_data',
        error: 'No user data returned from signup',
        results
      })
    }

    // Step 2: Check if user exists in auth.users
    console.log('Step 2: Checking if user exists in auth.users')
    const { data: authUsers, error: authCheckError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .eq('email', email)
      .limit(1)

    results.userExists = authUsers && authUsers.length > 0

    // Step 3: Check if user exists in public.users
    console.log('Step 3: Checking if user exists in public.users')
    const { data: publicUsers, error: publicCheckError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('email', email)
      .limit(1)

    results.publicUserExists = publicUsers && publicUsers.length > 0

    // Step 4: Try to create user manually in public.users
    console.log('Step 4: Attempting manual user creation')
    const { data: manualUserData, error: manualUserError } = await supabase
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

    results.manualUserCreation = manualUserData
    results.manualUserError = manualUserError

    return NextResponse.json({
      success: true,
      step: 'completed',
      message: 'Diagnostic completed',
      results
    })

  } catch (error: any) {
    console.error('Diagnostic error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Diagnostic failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
