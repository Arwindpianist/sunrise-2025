import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET() {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      checks: {}
    }

    // Check 1: Active triggers on user_subscriptions
    try {
      const { data: triggers, error: triggerError } = await supabaseAdmin
        .rpc('check_trigger_status')
      
      diagnostics.checks.triggers = {
        success: !triggerError,
        data: triggers,
        error: triggerError?.message
      }
    } catch (error: any) {
      diagnostics.checks.triggers = {
        success: false,
        error: error.message
      }
    }

    // Check 2: Table structure
    try {
      const { data: tableInfo, error: tableError } = await supabaseAdmin
        .from('user_subscriptions')
        .select('*')
        .limit(1)
      
      diagnostics.checks.table_structure = {
        success: !tableError,
        error: tableError?.message
      }
    } catch (error: any) {
      diagnostics.checks.table_structure = {
        success: false,
        error: error.message
      }
    }

    // Check 3: Security events table
    try {
      const { data: securityEvents, error: securityError } = await supabaseAdmin
        .from('security_events')
        .select('*')
        .limit(1)
      
      diagnostics.checks.security_events = {
        success: !securityError,
        error: securityError?.message
      }
    } catch (error: any) {
      diagnostics.checks.security_events = {
        success: false,
        error: error.message
      }
    }

    // Check 4: Audit log table
    try {
      const { data: auditLog, error: auditError } = await supabaseAdmin
        .from('subscription_audit_log')
        .select('*')
        .limit(1)
      
      diagnostics.checks.audit_log = {
        success: !auditError,
        error: auditError?.message
      }
    } catch (error: any) {
      diagnostics.checks.audit_log = {
        success: false,
        error: error.message
      }
    }

    // Check 5: Recent security events
    try {
      const { data: recentEvents, error: eventsError } = await supabaseAdmin
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      diagnostics.checks.recent_events = {
        success: !eventsError,
        data: recentEvents,
        error: eventsError?.message
      }
    } catch (error: any) {
      diagnostics.checks.recent_events = {
        success: false,
        error: error.message
      }
    }

    return new NextResponse(
      JSON.stringify(diagnostics),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error in registration diagnosis:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to diagnose registration issue',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json()

    if (action === 'remove_triggers') {
      // Remove all triggers
      const { error: dropError } = await supabaseAdmin.rpc('remove_all_subscription_triggers')
      
      if (dropError) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Failed to remove triggers',
            details: dropError.message
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      return new NextResponse(
        JSON.stringify({ 
          message: 'All subscription triggers removed. Registration should work now.',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new NextResponse(
      JSON.stringify({ error: 'Invalid action. Use "remove_triggers"' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error in registration action:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to perform action' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 