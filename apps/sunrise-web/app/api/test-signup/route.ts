import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    // Create server-side Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'SUPABASE_SERVICE_ROLE_KEY is not set' 
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Test user creation with a unique email
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'testpassword123'

    console.log('Testing signup with:', testEmail)

    // Test auth signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://sunrise-2025.com'}/auth/callback`,
      },
    })

    if (authError) {
      console.error('Auth signup failed:', authError)
      return NextResponse.json({ 
        success: false, 
        error: 'Auth signup failed',
        details: authError.message 
      }, { status: 400 })
    }

    if (!authData?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No user data returned' 
      }, { status: 400 })
    }

    console.log('Auth signup successful:', authData.user.id)

    // Test user record creation
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: 'Test User',
        subscription_plan: 'free',
        token_balance: 0,
        created_at: authData.user.created_at,
        updated_at: authData.user.created_at
      })
      .select()

    if (userError) {
      console.error('User record creation failed:', userError)
      return NextResponse.json({ 
        success: false, 
        error: 'User record creation failed',
        details: userError.message 
      }, { status: 400 })
    }

    console.log('User record created successfully:', userData[0])

    return NextResponse.json({
      success: true,
      message: 'Test signup successful',
      user: authData.user,
      userRecord: userData[0]
    })

  } catch (error: any) {
    console.error('Test signup error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test signup failed',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}