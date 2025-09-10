import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
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

    // Check for triggers on auth.users table
    const { data: triggers, error: triggerError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            trigger_name,
            event_manipulation,
            action_timing,
            action_statement
          FROM information_schema.triggers 
          WHERE event_object_table = 'users' 
          AND event_object_schema = 'auth'
          ORDER BY trigger_name;
        `
      })

    // Check for functions that might be related to user creation
    const { data: functions, error: functionError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            routine_name,
            routine_type,
            routine_definition
          FROM information_schema.routines 
          WHERE routine_name LIKE '%user%' 
          AND routine_schema = 'public'
          ORDER BY routine_name;
        `
      })

    return NextResponse.json({
      success: true,
      triggers: triggers || [],
      functions: functions || [],
      triggerError: triggerError?.message,
      functionError: functionError?.message,
      message: 'Trigger check completed'
    })

  } catch (error: any) {
    console.error('Error checking triggers:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check triggers',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
