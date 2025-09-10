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

    // Get all users who don't have balance records
    const { data: usersWithoutBalance, error: queryError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT u.id, u.email, u.created_at
          FROM auth.users u
          LEFT JOIN public.user_balances ub ON u.id = ub.user_id
          WHERE ub.user_id IS NULL
        `
      })

    if (queryError) {
      console.error('Error querying users without balance:', queryError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to query users without balance',
        details: queryError.message 
      }, { status: 500 })
    }

    if (!usersWithoutBalance || usersWithoutBalance.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All users already have balance records',
        fixedCount: 0
      })
    }

    // Create balance records for all users without them
    const balanceRecords = usersWithoutBalance.map(user => ({
      user_id: user.id,
      balance: 15, // Free users start with 15 tokens
      created_at: user.created_at,
      updated_at: user.created_at
    }))

    const { data: balanceData, error: balanceError } = await supabase
      .from('user_balances')
      .insert(balanceRecords)
      .select()

    if (balanceError) {
      console.error('Failed to create balance records:', balanceError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create balance records',
        details: balanceError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created balance records for ${balanceData.length} users`,
      fixedCount: balanceData.length,
      users: usersWithoutBalance.map(user => ({
        id: user.id,
        email: user.email
      }))
    })

  } catch (error: any) {
    console.error('Error fixing all balances:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fix all balances',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
