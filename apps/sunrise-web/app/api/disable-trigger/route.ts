import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    // Check if trigger exists first
    const { data: triggers, error: checkError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_object_table')
      .eq('trigger_name', 'on_auth_user_created')

    if (checkError) {
      console.error('Error checking triggers:', checkError)
    }

    // Try to disable the trigger using a direct SQL query
    // This might not work due to permissions, but let's try
    const { error: sqlError } = await supabase
      .from('pg_trigger')
      .select('*')
      .eq('tgname', 'on_auth_user_created')

    return NextResponse.json({
      success: true,
      message: 'Trigger check completed',
      triggerExists: triggers && triggers.length > 0,
      triggers: triggers,
      sqlError: sqlError?.message,
      instructions: [
        '1. Go to your Supabase dashboard',
        '2. Navigate to SQL Editor',
        '3. Run this SQL: DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;',
        '4. Run this SQL: DROP FUNCTION IF EXISTS public.handle_new_user();',
        '5. Test signup again'
      ]
    })

  } catch (error: any) {
    console.error('Disable trigger error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check trigger',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
