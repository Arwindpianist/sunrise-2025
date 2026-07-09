import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

type EmailLogRow = {
  id: string
  event_id: string
  contact_id: string
  status: string
  error_message: string | null
  sent_at: string
  opened_at: string | null
  event_title: string | null
  event_email_subject: string | null
  contact_first_name: string | null
  contact_last_name: string | null
  contact_email: string | null
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await db.query(
      `
      select
        el.id,
        el.event_id,
        el.contact_id,
        el.status,
        el.error_message,
        el.sent_at,
        el.opened_at,
        e.title as event_title,
        e.email_subject as event_email_subject,
        c.first_name as contact_first_name,
        c.last_name as contact_last_name,
        c.email as contact_email
      from email_logs el
      inner join events e on e.id = el.event_id and e.user_id = $1::uuid
      inner join contacts c on c.id = el.contact_id and c.user_id = $1::uuid
      order by el.sent_at desc nulls last
      limit 100
      `,
      [userId],
    )

    const logs = (result.rows as EmailLogRow[]).map((row) => ({
      id: row.id,
      event_id: row.event_id,
      contact_id: row.contact_id,
      status: row.status,
      error_message: row.error_message,
      sent_at: row.sent_at,
      opened_at: row.opened_at,
      event: {
        title: row.event_title ?? "",
        email_subject: row.event_email_subject ?? "",
      },
      contact: {
        first_name: row.contact_first_name ?? "",
        last_name: row.contact_last_name ?? "",
        email: row.contact_email ?? "",
      },
    }))

    return NextResponse.json({ logs })
  } catch (error: unknown) {
    const code = error && typeof error === "object" && "code" in error ? (error as { code?: string }).code : undefined
    if (code === "42P01") {
      return NextResponse.json({
        logs: [] as unknown[],
        unavailable: true,
        message: "Email logs require email_logs and related tables in your database.",
      })
    }
    console.error("email-logs GET:", error)
    return NextResponse.json({ error: "Failed to load email logs" }, { status: 500 })
  }
}
