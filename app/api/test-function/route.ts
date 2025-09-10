import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test if we can call the function directly
    const testUserId = '00000000-0000-0000-0000-000000000999'
    
    // First, let's try to insert a test user directly into auth.users (this will trigger the function)
    const { data: insertResult, error: insertError } = await supabase
      .from('auth.users')
      .insert({
        id: testUserId,
        email: 'test@function.com',
        created_at: new Date().toISOString(),
        raw_user_meta_data: { full_name: 'Function Test' }
      })
      .select()

    console.log('Direct insert result:', { insertResult, insertError })

    // Check if the user was created in public.users
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single()

    console.log('Public user after insert:', { publicUser, publicError })

    // Clean up test data
    if (publicUser) {
      await supabase
        .from('users')
        .delete()
        .eq('id', testUserId)
    }

    return NextResponse.json({
      success: true,
      insertResult: insertResult,
      insertError: insertError?.message || null,
      publicUser: publicUser,
      publicError: publicError?.message || null
    })

  } catch (error: any) {
    console.error('Function test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Function test error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
