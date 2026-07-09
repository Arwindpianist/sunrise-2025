import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const sos_alert_id = body.sos_alert_id as string | undefined
    const emergency_contact_id = body.emergency_contact_id as string | undefined
    const notification_type = (body.notification_type as string) || "push"
    const status = (body.status as string) || "pending"

    if (!sos_alert_id || !emergency_contact_id) {
      return NextResponse.json({ error: "sos_alert_id and emergency_contact_id required" }, { status: 400 })
    }

    const own = await db.query(
      `select sa.id from sos_alerts sa
       join emergency_contacts ec on ec.id = $2::uuid and ec.user_id = $3::uuid
       where sa.id = $1::uuid and sa.user_id = $3::uuid
       limit 1`,
      [sos_alert_id, emergency_contact_id, userId],
    )
    if (!own.rows.length) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { rows } = await db.query<{ id: string }>(
      `insert into sos_alert_notifications (
         id, sos_alert_id, emergency_contact_id, notification_type, status, sent_at, delivered_at, error_message, created_at
       )
       values (gen_random_uuid(), $1::uuid, $2::uuid, $3::text, $4::text, null, null, null, now())
       returning id`,
      [sos_alert_id, emergency_contact_id, notification_type, status],
    )

    return NextResponse.json(rows[0], { status: 201 })
  } catch (e) {
    console.error("POST /api/sos/alert-notifications:", e)
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
  }
}
