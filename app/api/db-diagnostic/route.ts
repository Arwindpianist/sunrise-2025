import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const results: any = {}

    // 1. Check if users table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    results.tableExists = {
      data: tableExists,
      error: tableError?.message || null
    }

    // 2. Check if we can insert into users table directly
    const testUserId = '00000000-0000-0000-0000-000000000001'
    const { data: insertTest, error: insertError } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        email: 'test@diagnostic.com',
        full_name: 'Test User',
        subscription_plan: 'free',
        token_balance: 0
      })
      .select()

    results.insertTest = {
      data: insertTest,
      error: insertError?.message || null
    }

    // 3. Clean up test data
    if (insertTest) {
      await supabase
        .from('users')
        .delete()
        .eq('id', testUserId)
    }

    // 4. Check if handle_new_user function exists by trying to call it
    const { data: functionTest, error: functionError } = await supabase
      .rpc('handle_new_user', { 
        new_user: {
          id: testUserId,
          email: 'test@function.com',
          created_at: new Date().toISOString(),
          raw_user_meta_data: { full_name: 'Function Test' }
        }
      })

    results.functionTest = {
      data: functionTest,
      error: functionError?.message || null
    }

    // 5. Check current users in the table
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(10)

    results.allUsers = {
      data: allUsers,
      error: usersError?.message || null
    }

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Diagnostic error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
