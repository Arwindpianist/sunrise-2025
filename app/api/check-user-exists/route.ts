import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email is required' 
      }, { status: 400 })
    }

    // Check if user exists in auth.users (this is read-only for security)
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .eq('email', email)
      .limit(1)

    // Check if user exists in public.users
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('email', email)
      .limit(1)

    return NextResponse.json({
      success: true,
      email: email,
      existsInAuth: authUsers && authUsers.length > 0,
      existsInPublic: publicUsers && publicUsers.length > 0,
      authUser: authUsers?.[0] || null,
      publicUser: publicUsers?.[0] || null,
      errors: {
        authError: authError?.message,
        publicError: publicError?.message
      }
    })

  } catch (error: any) {
    console.error('Check user error:', error)
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
