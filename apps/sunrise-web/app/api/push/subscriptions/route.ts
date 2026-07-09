import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      const { rows } = await db.query(
        `select id, endpoint, is_active, created_at, updated_at
         from push_subscriptions
         where user_id = $1::uuid and is_active = true`,
        [userId],
      )
      return NextResponse.json({ subscriptions: rows })
    } catch {
      return NextResponse.json({ subscriptions: [] })
    }
  } catch (e) {
    console.error("GET /api/push/subscriptions:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/** Upsert one Web Push subscription row for the signed-in user (same endpoint = update keys + reactivate). */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const endpoint = typeof body.endpoint === "string" ? body.endpoint.trim() : ""
    const p256dh_key = typeof body.p256dh_key === "string" ? body.p256dh_key : ""
    const auth_key = typeof body.auth_key === "string" ? body.auth_key : ""

    if (!endpoint || !p256dh_key || !auth_key) {
      return NextResponse.json({ error: "endpoint, p256dh_key, and auth_key are required" }, { status: 400 })
    }

    const { rowCount } = await db.query(
      `update push_subscriptions
       set p256dh_key = $3, auth_key = $4, is_active = true, updated_at = now()
       where user_id = $1::uuid and endpoint = $2`,
      [userId, endpoint, p256dh_key, auth_key],
    )

    if (!rowCount) {
      await db.query(
        `insert into push_subscriptions (id, user_id, endpoint, p256dh_key, auth_key, is_active, created_at, updated_at)
         values (gen_random_uuid(), $1::uuid, $2, $3, $4, true, now(), now())`,
        [userId, endpoint, p256dh_key, auth_key],
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("POST /api/push/subscriptions:", e)
    return NextResponse.json({ error: "Failed to save push subscription" }, { status: 500 })
  }
}
