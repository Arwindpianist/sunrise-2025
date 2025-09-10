import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email, fullName } = await request.json()

    // Test inserting a user record directly
    const testUserId = '00000000-0000-0000-0000-000000000888'
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        email: email || 'test@insert.com',
        full_name: fullName || 'Test Insert User',
        subscription_plan: 'free',
        token_balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      }, { status: 400 })
    }

    // Clean up test data
    await supabase
      .from('users')
      .delete()
      .eq('id', testUserId)

    return NextResponse.json({
      success: true,
      message: 'User insert test successful',
      data: data[0]
    })

  } catch (error: any) {
    console.error('Test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
