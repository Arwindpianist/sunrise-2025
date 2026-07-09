import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireDashboardAdmin } from "@/lib/dashboard-admin"

export const dynamic = "force-dynamic"

export async function GET() {
  const gate = await requireDashboardAdmin()
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  try {
    const { rows: alertRows } = await db.query<{
      id: string
      user_id: string
      status: string
      location_lat: number | null
      location_lng: number | null
      location_address: string | null
      triggered_at: string
      resolved_at: string | null
      notes: string | null
      created_at: string
      user_email: string
      user_full_name: string | null
    }>(
      `select sa.id, sa.user_id, sa.status, sa.location_lat, sa.location_lng, sa.location_address,
              sa.triggered_at, sa.resolved_at, sa.notes, sa.created_at,
              u.email as user_email, u.full_name as user_full_name
       from sos_alerts sa
       join users u on u.id = sa.user_id
       order by coalesce(sa.triggered_at, sa.created_at) desc nulls last`,
    )

    if (alertRows.length === 0) {
      return NextResponse.json([])
    }

    const alertIds = alertRows.map((a) => a.id)
    const { rows: notifRows } = await db.query<{
      id: string
      sos_alert_id: string
      notification_type: string
      status: string
      sent_at: string | null
      delivered_at: string | null
      error_message: string | null
      first_name: string
      last_name: string | null
      contact_email: string
      contact_phone: string | null
    }>(
      `select san.id, san.sos_alert_id, san.notification_type, san.status, san.sent_at, san.delivered_at, san.error_message,
              c.first_name, c.last_name, c.email as contact_email, c.phone as contact_phone
       from sos_alert_notifications san
       join emergency_contacts ec on ec.id = san.emergency_contact_id
       join contacts c on c.id = ec.contact_id
       where san.sos_alert_id = any($1::uuid[])`,
      [alertIds],
    )

    const byAlert = new Map<string, typeof notifRows>()
    for (const n of notifRows) {
      const list = byAlert.get(n.sos_alert_id) ?? []
      list.push(n)
      byAlert.set(n.sos_alert_id, list)
    }

    const payload = alertRows.map((a) => ({
      id: a.id,
      user_id: a.user_id,
      status: a.status,
      location_lat: a.location_lat,
      location_lng: a.location_lng,
      location_address: a.location_address,
      triggered_at: a.triggered_at,
      resolved_at: a.resolved_at,
      notes: a.notes,
      created_at: a.created_at,
      user: {
        email: a.user_email,
        user_metadata: {
          full_name: a.user_full_name ?? undefined,
          phone: undefined as string | undefined,
        },
      },
      notifications: (byAlert.get(a.id) ?? []).map((n) => ({
        id: n.id,
        notification_type: n.notification_type,
        status: n.status,
        sent_at: n.sent_at,
        delivered_at: n.delivered_at,
        error_message: n.error_message,
        emergency_contact: {
          contact: {
            first_name: n.first_name,
            last_name: n.last_name,
            email: n.contact_email,
            phone: n.contact_phone,
          },
        },
      })),
    }))

    return NextResponse.json(payload)
  } catch (e) {
    console.error("GET /api/admin/emergency-alerts:", e)
    return NextResponse.json({ error: "Failed to load alerts" }, { status: 500 })
  }
}
