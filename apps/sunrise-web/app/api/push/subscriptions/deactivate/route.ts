import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      await db.query(
        `update push_subscriptions set is_active = false, updated_at = now() where user_id = $1::uuid`,
        [userId],
      )
    } catch {
      /* table may be missing in some environments */
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("POST /api/push/subscriptions/deactivate:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
