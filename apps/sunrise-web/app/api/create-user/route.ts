import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { userId, email, fullName } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: userId and email' 
      }, { status: 400 })
    }

    // Create user record in public.users table
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        full_name: fullName || '',
        subscription_plan: 'free',
        token_balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Error creating user record:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      user: data[0]
    })

  } catch (error: any) {
    console.error('Create user error:', error)
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
