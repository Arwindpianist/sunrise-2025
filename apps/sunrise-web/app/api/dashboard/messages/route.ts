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

    const { rows: userEvents } = await db.query<{ id: string; title: string }>(
      `select id, title from events where user_id = $1::uuid`,
      [userId],
    )

    const eventIds = userEvents.map((e) => e.id)
    let emailLogs: Record<string, unknown>[] = []
    let telegramLogs: Record<string, unknown>[] = []
    let discordLogs: Record<string, unknown>[] = []
    let slackLogs: Record<string, unknown>[] = []

    if (eventIds.length > 0) {
      const { rows: el } = await db.query(
        `select id, event_id, contact_id, status, sent_at, error_message
         from email_logs where event_id = any($1::uuid[])
         order by sent_at desc nulls last`,
        [eventIds],
      )
      emailLogs = el as Record<string, unknown>[]

      try {
        const { rows: tl } = await db.query(
          `select id, event_id, contact_id, status, sent_at, error_message
           from telegram_logs where event_id = any($1::uuid[])
           order by sent_at desc nulls last`,
          [eventIds],
        )
        telegramLogs = tl as Record<string, unknown>[]
      } catch {
        telegramLogs = []
      }
    }

    try {
      const { rows: dl } = await db.query(
        `select id, user_id, status, created_at, error_message
         from discord_logs where user_id = $1::uuid
         order by created_at desc nulls last`,
        [userId],
      )
      discordLogs = dl as Record<string, unknown>[]
    } catch {
      discordLogs = []
    }

    try {
      const { rows: sl } = await db.query(
        `select id, user_id, status, created_at, error_message
         from slack_logs where user_id = $1::uuid
         order by created_at desc nulls last`,
        [userId],
      )
      slackLogs = sl as Record<string, unknown>[]
    } catch {
      slackLogs = []
    }

    return NextResponse.json({
      userEvents,
      emailLogs,
      telegramLogs,
      discordLogs,
      slackLogs,
    })
  } catch (e) {
    console.error("GET /api/dashboard/messages:", e)
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 })
  }
}
