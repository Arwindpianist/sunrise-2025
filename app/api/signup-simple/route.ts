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

    // Create server-side Supabase client
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

    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || '' },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://sunrise-2025.com'}/auth/callback`,
      },
    })

    if (authError) {
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

    // Create user record (ignore errors)
    try {
      await supabase.from('users').insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName || '',
        subscription_plan: 'free',
        token_balance: 0,
        created_at: authData.user.created_at,
        updated_at: authData.user.created_at
      })
    } catch (userError) {
      console.log('User record creation failed (ignoring):', userError)
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
      message: 'User created successfully'
    })

  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Signup failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
