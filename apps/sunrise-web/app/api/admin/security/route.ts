import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { subscriptionMonitor } from "@/lib/subscription-monitoring"

export const dynamic = "force-dynamic"

// Get security report and alerts
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userError || userData?.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: "Admin access required" }),
        { 
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Get security report
    const securityReport = await subscriptionMonitor.generateSecurityReport()

    // Get recent security events from database
    const { data: securityEvents } = await supabase
      .from('security_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    // Get recent subscription audit logs
    const { data: auditLogs } = await supabase
      .from('subscription_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    // Get users with potential issues
    const { data: problematicSubscriptions } = await supabase
      .from('user_subscriptions')
      .select(`
        user_id,
        tier,
        status,
        stripe_subscription_id,
        created_at,
        updated_at
      `)
      .or('status.eq.past_due,status.eq.inactive')
      .order('updated_at', { ascending: false })
      .limit(20)

    return new NextResponse(
      JSON.stringify({
        securityReport,
        securityEvents: securityEvents || [],
        auditLogs: auditLogs || [],
        problematicSubscriptions: problematicSubscriptions || [],
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("Error in security monitoring:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

// Resolve an alert
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userError || userData?.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: "Admin access required" }),
        { 
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const { action, alertId, userId } = await request.json()

    switch (action) {
      case 'resolve_alert':
        if (!alertId) {
          return new NextResponse(
            JSON.stringify({ error: "Alert ID required" }),
            { 
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          )
        }
        subscriptionMonitor.resolveAlert(alertId)
        break

      case 'check_user_consistency':
        if (!userId) {
          return new NextResponse(
            JSON.stringify({ error: "User ID required" }),
            { 
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          )
        }
        const consistencyCheck = await subscriptionMonitor.checkSubscriptionConsistency(userId)
        return new NextResponse(
          JSON.stringify(consistencyCheck),
          { 
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )

      case 'detect_patterns':
        await subscriptionMonitor.detectUnusualPatterns()
        break

      default:
        return new NextResponse(
          JSON.stringify({ error: "Invalid action" }),
          { 
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        )
    }

    return new NextResponse(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("Error in security action:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
} 