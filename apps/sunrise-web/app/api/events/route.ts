import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getContactIdsForEventCategory } from "@/lib/event-contact-ids"
import { fetchEventsRowsForUser } from "@/lib/events-list-query"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    const rows = await fetchEventsRowsForUser(userId)

    const payload = rows.map((row: Record<string, unknown>) => {
      const r = { ...row }
      delete r.contact_count
      const ec = row.contact_count as number
      const raw = row as {
        description?: string | null
        location?: string | null
        scheduled_send_time?: string | null
        telegram_template?: string | null
        discord_template?: string | null
        slack_template?: string | null
        email_subject?: string | null
        email_template?: string | null
        status?: string | null
      }
      return {
        ...r,
        description: raw.description ?? "",
        location: raw.location ?? "",
        scheduled_send_time: raw.scheduled_send_time ?? "",
        telegram_template: raw.telegram_template ?? null,
        discord_template: raw.discord_template ?? null,
        slack_template: raw.slack_template ?? null,
        email_subject: raw.email_subject ?? "",
        email_template: raw.email_template ?? "",
        status: (raw.status || "draft") as "draft" | "scheduled" | "sent" | "cancelled",
        contact_count: ec ?? 0,
      }
    })

    return NextResponse.json(payload)
  } catch (error) {
    console.error("GET /api/events:", error)
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      eventDate,
      location,
      categoryId,
      emailSubject,
      emailTemplate,
      sendOption,
      scheduledSendTime,
      sendEmail,
    } = body

    if (!title || !eventDate || !emailSubject || !emailTemplate) {
      return NextResponse.json(
        { error: "Title, event date, email subject, and template are required." },
        { status: 400 },
      )
    }

    let categoryName = "general"
    if (categoryId && categoryId !== "all") {
      const categoryResult = await db.query<{ name: string }>(
        `select name from contact_categories where id = $1 and user_id = $2 limit 1`,
        [categoryId, session.user.id],
      )
      categoryName = categoryResult.rows[0]?.name || "general"
    }

    const eventResult = await db.query(
      `
      insert into events (
        id, user_id, title, description, event_date, location, category,
        email_subject, email_template, send_email, status, scheduled_send_time, created_at
      )
      values (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, now()
      )
      returning *
      `,
      [
        session.user.id,
        title,
        description || null,
        eventDate,
        location || null,
        categoryName,
        emailSubject,
        emailTemplate,
        sendEmail !== false,
        "draft",
        sendOption === "schedule" ? scheduledSendTime || null : null,
      ],
    )

    const event = eventResult.rows[0]

    const contactIds = await getContactIdsForEventCategory(session.user.id, categoryName)

    if (contactIds.length) {
      try {
        const placeholders = contactIds
          .map((_, i) => `(gen_random_uuid(), $1, $${i + 2}, 'pending', now())`)
          .join(", ")

        await db.query(
          `
          insert into event_contacts (id, event_id, contact_id, status, created_at)
          values ${placeholders}
          `,
          [event.id, ...contactIds],
        )
      } catch (insertErr: unknown) {
        const msg = insertErr instanceof Error ? insertErr.message : String(insertErr)
        const code = insertErr && typeof insertErr === "object" && "code" in insertErr ? (insertErr as { code: string }).code : ""
        if (code === "42P01" && msg.includes("event_contacts")) {
          console.warn(
            "[events POST] event_contacts table missing; event saved without audience links. Run db/migrations/001_event_contacts.sql on Neon.",
          )
        } else {
          throw insertErr
        }
      }
    }

    return NextResponse.json({
      event,
      contactCount: contactIds.length,
    })
  } catch (error) {
    console.error("Failed to create event:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}

