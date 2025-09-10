import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and password are required' 
      }, { status: 400 })
    }

    // Create server-side Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json({ 
        success: false, 
        error: 'Server configuration error' 
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

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
    console.log('Auth data:', {
      id: authData.user.id,
      email: authData.user.email,
      created_at: authData.user.created_at
    })
    
    let userData = null
    
    try {
      // First, check if user already exists (in case trigger created it)
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (existingUser) {
        console.log('User record already exists (likely created by trigger):', existingUser)
        userData = existingUser
      } else {
        // Create the user record manually
        const { data: newUserData, error: userError } = await supabase
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
          // Check if it's a duplicate key error (user already exists)
          if (userError.code === '23505') {
            console.log('User record already exists (duplicate key), fetching existing record...')
            // Try to fetch the existing record
            const { data: existingUserData } = await supabase
              .from('users')
              .select('*')
              .eq('id', authData.user.id)
              .single()
            userData = existingUserData
          } else {
            // For other errors, we should still return success since auth user was created
            console.warn('User record creation failed but auth user exists:', userError.message)
          }
        } else {
          console.log('User record created successfully:', newUserData[0])
          userData = newUserData[0]
        }
      }
    } catch (userCreationError) {
      console.error('Exception during user record creation:', userCreationError)
      // Don't fail the signup if user creation fails
      // The auth user was created successfully
    }
    
    // Ensure userData is always defined
    if (!userData) {
      userData = null
    }

    console.log('Returning success response with userData:', userData)
    
    const response = {
      success: true,
      user: authData.user,
      userRecord: userData || null,
      message: 'User created successfully via server-side signup'
    }
    
    console.log('Final response:', response)
    
    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Server-side signup error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    })
    return NextResponse.json(
      { 
        success: false, 
        error: 'Server-side signup failed',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}
