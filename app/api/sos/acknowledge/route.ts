import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const { sos_alert_id, acknowledged_at } = await request.json()

    if (!sos_alert_id) {
      return new NextResponse(JSON.stringify({ error: "Missing SOS alert ID" }), { status: 400 })
    }

    // Update the SOS alert to mark it as acknowledged
    const { data, error } = await supabase
      .from('sos_alerts')
      .update({ 
        status: 'acknowledged',
        resolved_at: acknowledged_at || new Date().toISOString()
      })
      .eq('id', sos_alert_id)
      .select()

    if (error) {
      console.error('Error acknowledging SOS alert:', error)
      return new NextResponse(JSON.stringify({ error: "Failed to acknowledge SOS alert" }), { status: 500 })
    }

    // Also update the notification status
    await supabase
      .from('sos_alert_notifications')
      .update({ 
        status: 'acknowledged',
        delivered_at: new Date().toISOString()
      })
      .eq('sos_alert_id', sos_alert_id)

    console.log('SOS alert acknowledged successfully:', sos_alert_id)

    return new NextResponse(JSON.stringify({ 
      success: true, 
      message: "SOS alert acknowledged successfully" 
    }), { status: 200 })

  } catch (error: any) {
    console.error('Error acknowledging SOS alert:', error)
    return new NextResponse(JSON.stringify({ 
      error: "Internal server error", 
      details: error.message 
    }), { status: 500 })
  }
}
