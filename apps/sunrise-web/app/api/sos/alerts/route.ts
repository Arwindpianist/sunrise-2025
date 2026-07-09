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
    const status = (body.status as string) || "active"
    const location_lat = body.location_lat ?? null
    const location_lng = body.location_lng ?? null
    const location_address =
      (body.location_address as string | null | undefined) ??
      (body.location as string | null | undefined) ??
      null
    const triggered_at = (body.triggered_at as string) || new Date().toISOString()
    const notes = (body.notes as string | null | undefined) ?? null

    const { rows } = await db.query(
      `insert into sos_alerts (
         id, user_id, status, location_lat, location_lng, location_address, triggered_at, resolved_at, notes, created_at
       )
       values (
         gen_random_uuid(), $1::uuid, $2::text, $3, $4, $5, $6::timestamptz, null, $7, now()
       )
       returning id, user_id, status, location_lat, location_lng, location_address, triggered_at, resolved_at, notes, created_at`,
      [userId, status, location_lat, location_lng, location_address, triggered_at, notes],
    )

    return NextResponse.json(rows[0], { status: 201 })
  } catch (e) {
    console.error("POST /api/sos/alerts:", e)
    return NextResponse.json({ error: "Failed to create SOS alert" }, { status: 500 })
  }
}
