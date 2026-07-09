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
    const { rows } = await db.query(
      `select id, email, full_name, created_at from users order by coalesce(created_at, to_timestamp(0)) desc nulls last`,
    )
    return NextResponse.json(rows)
  } catch (e) {
    console.error("GET /api/admin/users:", e)
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 })
  }
}
