import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await context.params
    const { rows } = await db.query(
      `select * from events where id = $1 and user_id = $2`,
      [eventId, session.user.id],
    )

    if (!rows.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error("GET /api/events/[eventId]:", error)
    return NextResponse.json({ error: "Failed to load event" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await context.params
    const userId = session.user.id

    const owned = await db.query<{ id: string }>(
      `select id from events where id = $1 and user_id = $2`,
      [eventId, userId],
    )
    if (!owned.rows.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await db.query("delete from email_logs where event_id = $1", [eventId])
    try {
      await db.query("delete from telegram_logs where event_id = $1", [eventId])
    } catch {
      /* optional table in older dumps */
    }

    try {
      await db.query("delete from event_contacts where event_id = $1", [eventId])
    } catch {
      /* schema without event_contacts */
    }

    await db.query(`delete from events where id = $1 and user_id = $2`, [eventId, userId])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/events/[eventId]:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
