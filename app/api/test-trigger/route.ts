import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test if the function exists and can be called
    const { data: functionExists, error: functionError } = await supabase
      .rpc('handle_new_user')

    return NextResponse.json({
      success: true,
      functionExists: functionExists,
      functionError: functionError?.message || null,
      message: 'Function test completed'
    })

  } catch (error: any) {
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
