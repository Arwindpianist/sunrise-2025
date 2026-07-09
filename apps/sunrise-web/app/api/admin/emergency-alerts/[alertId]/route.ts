import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireDashboardAdmin } from "@/lib/dashboard-admin"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ alertId: string }> },
) {
  const gate = await requireDashboardAdmin()
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  try {
    const { alertId } = await context.params
    const body = await request.json().catch(() => ({}))
    const status = body.status as string | undefined
    if (!status || !["acknowledged", "resolved", "active", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    await db.query(
      `update sos_alerts
       set status = $2::text,
           resolved_at = case
             when $2::text in ('acknowledged', 'resolved') then now()
             else resolved_at
           end
       where id = $1::uuid`,
      [alertId, status],
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("PATCH /api/admin/emergency-alerts/[alertId]:", e)
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 })
  }
}
