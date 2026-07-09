import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

type TelegramLogRow = {
  id: string
  event_id: string
  contact_id: string
  status: string
  error_message: string | null
  sent_at: string
  event_title: string | null
  contact_first_name: string | null
  contact_last_name: string | null
  contact_phone: string | null
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
        tl.id,
        tl.event_id,
        tl.contact_id,
        tl.status,
        tl.error_message,
        tl.sent_at,
        e.title as event_title,
        c.first_name as contact_first_name,
        c.last_name as contact_last_name,
        c.phone as contact_phone
      from telegram_logs tl
      inner join events e on e.id = tl.event_id and e.user_id = $1::uuid
      inner join contacts c on c.id = tl.contact_id and c.user_id = $1::uuid
      order by tl.sent_at desc nulls last
      limit 100
      `,
      [userId],
    )

    const logs = (result.rows as TelegramLogRow[]).map((row) => ({
      id: row.id,
      event_id: row.event_id,
      contact_id: row.contact_id,
      status: row.status,
      error_message: row.error_message,
      sent_at: row.sent_at,
      event: {
        title: row.event_title ?? "",
      },
      contact: {
        first_name: row.contact_first_name ?? "",
        last_name: row.contact_last_name ?? "",
        phone: row.contact_phone ?? "",
      },
    }))

    return NextResponse.json({ logs })
  } catch (error: unknown) {
    const code = error && typeof error === "object" && "code" in error ? (error as { code?: string }).code : undefined
    if (code === "42P01") {
      return NextResponse.json({
        logs: [] as unknown[],
        unavailable: true,
        message: "Telegram logs require telegram_logs and related tables in your database.",
      })
    }
    console.error("telegram-logs GET:", error)
    return NextResponse.json({ error: "Failed to load Telegram logs" }, { status: 500 })
  }
}
