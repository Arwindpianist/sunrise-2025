import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const status = body.status as string | undefined
    if (!status) {
      return NextResponse.json({ error: "status required" }, { status: 400 })
    }

    const sent_at = body.sent_at as string | null | undefined
    const error_message = body.error_message as string | null | undefined

    const { rowCount } = await db.query(
      `update sos_alert_notifications san
       set status = $3::text,
           sent_at = case when $4::timestamptz is not null then $4::timestamptz else san.sent_at end,
           error_message = case when $5::text is not null then $5::text else san.error_message end
       where san.id = $1::uuid
         and exists (
           select 1 from sos_alerts sa
           where sa.id = san.sos_alert_id and sa.user_id = $2::uuid
         )`,
      [id, userId, status, sent_at ?? null, error_message ?? null],
    )

    if (!rowCount) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("PATCH /api/sos/alert-notifications/[id]:", e)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}
