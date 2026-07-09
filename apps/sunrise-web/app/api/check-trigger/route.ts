import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Check if the trigger exists by querying the system tables
    const { data: triggerCheck, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('trigger_name', 'on_auth_user_created')
      .eq('event_object_table', 'users')
      .eq('event_object_schema', 'auth')

    // Check if the function exists by querying the system tables
    const { data: functionCheck, error: functionError } = await supabase
      .from('information_schema.routines')
      .select('*')
      .eq('routine_name', 'handle_new_user')
      .eq('routine_schema', 'public')

    return NextResponse.json({
      success: true,
      trigger: {
        data: triggerCheck,
        error: triggerError?.message || null
      },
      function: {
        data: functionCheck,
        error: functionError?.message || null
      }
    })

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Check error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
