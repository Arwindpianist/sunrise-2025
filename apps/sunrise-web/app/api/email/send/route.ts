import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendEmail, DEFAULT_FROM_EMAIL } from "@/lib/zoho-email"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 })
    }

    const eventResult = await db.query(
      `select * from events where id = $1 and user_id = $2`,
      [eventId, userId],
    )
    const event = eventResult.rows[0]
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const pendingResult = await db.query<{
      ec_id: string
      contact_id: string
      email: string
      first_name: string | null
      last_name: string | null
    }>(
      `
      select ec.id as ec_id, c.id as contact_id, c.email, c.first_name, c.last_name
      from event_contacts ec
      join contacts c on c.id = ec.contact_id
      where ec.event_id = $1 and ec.status = 'pending'
      `,
      [eventId],
    )

    const rows = pendingResult.rows
    console.log(`Found ${rows.length} pending event contacts for event ${eventId}`)

    for (const row of rows) {
      try {
        const emailTemplate = String(event.email_template || "")
          .replace("{{firstName}}", row.first_name || "")
          .replace("{{lastName}}", row.last_name || "")
          .replace("{{eventTitle}}", event.title)
          .replace("{{eventDate}}", new Date(event.event_date).toLocaleDateString())
          .replace("{{eventLocation}}", event.location || "")

        const sent = await sendEmail({
          from: DEFAULT_FROM_EMAIL,
          to: row.email,
          subject: event.email_subject,
          html: emailTemplate,
        })
        if (!sent) {
          throw new Error("Failed to send email via Zoho SMTP")
        }

        await db.query(
          `update event_contacts set status = 'sent', sent_at = now() where id = $1`,
          [row.ec_id],
        )

        await db.query(
          `
          insert into email_logs (id, event_id, contact_id, status, sent_at, error_message)
          values (gen_random_uuid(), $1, $2, 'sent', now(), null)
          `,
          [eventId, row.contact_id],
        )
      } catch (error) {
        console.error("Error sending email to contact:", error)

        await db.query(`update event_contacts set status = 'failed' where id = $1`, [row.ec_id])

        await db.query(
          `
          insert into email_logs (id, event_id, contact_id, status, sent_at, error_message)
          values (gen_random_uuid(), $1, $2, 'failed', now(), $3)
          `,
          [
            eventId,
            row.contact_id,
            error instanceof Error ? error.message : "Unknown error",
          ],
        )
      }
    }

    const pendingCountResult = await db.query<{ n: string }>(
      `select count(*)::text as n from event_contacts where event_id = $1 and status = 'pending'`,
      [eventId],
    )
    const pendingCount = Number.parseInt(pendingCountResult.rows[0]?.n ?? "0", 10)

    if (pendingCount === 0) {
      await db.query(`update events set status = 'sent' where id = $1`, [eventId])
    }

    return NextResponse.json({ message: "Emails sent successfully" })
  } catch (error: unknown) {
    console.error("Error in email sending:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
