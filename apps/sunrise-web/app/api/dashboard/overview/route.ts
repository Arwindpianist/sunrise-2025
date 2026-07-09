import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { unstable_cache } from "next/cache"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

async function buildDashboardOverview(userId: string) {
  const [eventsCountResult, contactsCountResult, balanceResult, recentEventsResult] = await Promise.all([
    db.query(`select count(*)::int as count from events where user_id = $1`, [userId]),
    db.query(`select count(*)::int as count from contacts where user_id = $1`, [userId]),
    db.query(`select balance from user_balances where user_id = $1 limit 1`, [userId]),
    db.query(
      `
      select id, title, status, created_at
      from events
      where user_id = $1
      order by coalesce(created_at, event_date::timestamptz, to_timestamp(0)) desc nulls last
      limit 5
      `,
      [userId],
    ),
  ])

  let totalEmails = 0
  try {
    const emailsCountResult = await db.query(
      `select count(*)::int as count from transactions where user_id = $1 and type = 'usage' and status = 'completed'`,
      [userId],
    )
    totalEmails = emailsCountResult.rows[0]?.count ?? 0
  } catch (error: unknown) {
    const code = error && typeof error === "object" && "code" in error ? (error as { code?: string }).code : undefined
    if (code !== "42P01") {
      throw error
    }

    try {
      const fallbackEmailsResult = await db.query(
        `
          select count(*)::int as count
          from email_logs el
          join events e on e.id = el.event_id
          where e.user_id = $1 and el.status = 'sent'
          `,
        [userId],
      )
      totalEmails = fallbackEmailsResult.rows[0]?.count ?? 0
    } catch {
      totalEmails = 0
    }
  }

  return {
    stats: {
      totalEvents: eventsCountResult.rows[0]?.count ?? 0,
      totalContacts: contactsCountResult.rows[0]?.count ?? 0,
      totalEmails,
      balance: balanceResult.rows[0]?.balance ?? 0,
    },
    recentEvents: recentEventsResult.rows ?? [],
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    const payload = await unstable_cache(
      () => buildDashboardOverview(userId),
      ["dashboard-overview", userId],
      { revalidate: 30, tags: [`user-dashboard-${userId}`] },
    )()

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, max-age=15, stale-while-revalidate=45",
      },
    })
  } catch (error) {
    console.error("Error fetching dashboard overview:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
