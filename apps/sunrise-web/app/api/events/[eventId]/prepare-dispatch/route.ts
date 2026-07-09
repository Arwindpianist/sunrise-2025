import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getContactIdsForEventCategory } from "@/lib/event-contact-ids"

export const dynamic = "force-dynamic"

/**
 * Rebuilds `event_contacts` for this event in Neon (delete + insert pending rows)
 * so sends and re-sends always match the current audience and create fresh pending rows.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const client = await db.connect()
  try {
    const { eventId } = await context.params
    const userId = session.user.id

    const ev = await client.query<{ category: string | null }>(
      `select category from events where id = $1 and user_id = $2`,
      [eventId, userId],
    )
    if (!ev.rows.length) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const contactIds = await getContactIdsForEventCategory(userId, ev.rows[0].category)

    await client.query("BEGIN")
    await client.query(`delete from event_contacts where event_id = $1`, [eventId])

    if (contactIds.length > 0) {
      const placeholders = contactIds
        .map((_, i) => `(gen_random_uuid(), $1, $${i + 2}, 'pending', now())`)
        .join(", ")

      await client.query(
        `
        insert into event_contacts (id, event_id, contact_id, status, created_at)
        values ${placeholders}
        `,
        [eventId, ...contactIds],
      )
    }

    await client.query("COMMIT")

    return NextResponse.json({ ok: true, contactCount: contactIds.length })
  } catch (error: unknown) {
    try {
      await client.query("ROLLBACK")
    } catch {
      /* ignore */
    }
    const code =
      error && typeof error === "object" && "code" in error ? String((error as { code: string }).code) : ""
    const msg = error instanceof Error ? error.message : String(error)
    if (code === "42P01" && msg.includes("event_contacts")) {
      console.error("POST prepare-dispatch: event_contacts missing — apply db/migrations/001_event_contacts.sql on Neon")
      return NextResponse.json(
        {
          error:
            "Database is missing the event_contacts table. Apply db/migrations/001_event_contacts.sql in Neon, then retry.",
          code: "MISSING_EVENT_CONTACTS",
        },
        { status: 503 },
      )
    }
    console.error("POST prepare-dispatch:", error)
    return NextResponse.json({ error: "Failed to prepare contacts for send" }, { status: 500 })
  } finally {
    client.release()
  }
}
