import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 })
    }

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

    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Check if balance record already exists
    const { data: existingBalance } = await supabase
      .from('user_balances')
      .select('id, balance')
      .eq('user_id', userId)
      .single()

    if (existingBalance) {
      return NextResponse.json({
        success: true,
        message: 'Balance record already exists',
        balance: existingBalance.balance,
        user: userData
      })
    }

    // Create balance record
    const { data: balanceData, error: balanceError } = await supabase
      .from('user_balances')
      .insert({
        user_id: userId,
        balance: 15, // Free users start with 15 tokens
        created_at: userData.created_at,
        updated_at: userData.created_at
      })
      .select()

    if (balanceError) {
      console.error('Failed to create balance record:', balanceError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create balance record',
        details: balanceError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Balance record created successfully',
      balance: balanceData[0],
      user: userData
    })

  } catch (error: any) {
    console.error('Error fixing user balance:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fix user balance',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
