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
    // Check if security_events table exists
    const { data: securityEvents, error: securityError } = await supabaseAdmin
      .from('security_events')
      .select('*')
      .limit(1)

    // Check if subscription_audit_log table exists
    const { data: auditLog, error: auditError } = await supabaseAdmin
      .from('subscription_audit_log')
      .select('*')
      .limit(1)

    // Check user_subscriptions table
    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .limit(1)

    // Check users table
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1)

    return new NextResponse(
      JSON.stringify({
        message: 'Database status check completed',
        tables: {
          security_events: {
            exists: !securityError,
            error: securityError?.message
          },
          subscription_audit_log: {
            exists: !auditError,
            error: auditError?.message
          },
          user_subscriptions: {
            exists: !subsError,
            error: subsError?.message
          },
          users: {
            exists: !usersError,
            error: usersError?.message
          }
        },
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error checking database:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to check database status' }),
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

    if (action === 'disable_triggers') {
      // Disable problematic triggers temporarily
      const { error: disableError } = await supabaseAdmin.rpc('disable_subscription_triggers')
      
      if (disableError) {
        console.error('Error disabling triggers:', disableError)
        return new NextResponse(
          JSON.stringify({ 
            error: 'Failed to disable triggers',
            details: disableError.message
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      return new NextResponse(
        JSON.stringify({ 
          message: 'Triggers disabled successfully. New user registration should work now.',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (action === 'enable_triggers') {
      // Re-enable triggers
      const { error: enableError } = await supabaseAdmin.rpc('enable_subscription_triggers')
      
      if (enableError) {
        console.error('Error enabling triggers:', enableError)
        return new NextResponse(
          JSON.stringify({ 
            error: 'Failed to enable triggers',
            details: enableError.message
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      return new NextResponse(
        JSON.stringify({ 
          message: 'Triggers enabled successfully.',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new NextResponse(
      JSON.stringify({ error: 'Invalid action. Use "disable_triggers" or "enable_triggers"' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error in database action:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to perform database action' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 