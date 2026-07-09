import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * Aggregates GDPR-style dashboard counts from Neon for the signed-in user.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const email = session.user?.email ?? ""
    const name = session.user?.name ?? ""

    let createdAt = ""
    try {
      const u = await db.query(`select created_at from users where id = $1::uuid limit 1`, [userId])
      const raw = u.rows[0]?.created_at
      createdAt = raw ? new Date(raw as string).toISOString() : ""
    } catch {
      createdAt = ""
    }

    const contactsCountRes = await db.query(`select count(*)::int as c from contacts where user_id = $1::uuid`, [userId])
    const contactsTotal = contactsCountRes.rows[0]?.c ?? 0

    const categories: Record<string, number> = {}
    try {
      const catRes = await db.query(
        `
        select coalesce(nullif(trim(category::text), ''), 'uncategorized') as cat, count(*)::int as count
        from contacts
        where user_id = $1::uuid
        group by coalesce(nullif(trim(category::text), ''), 'uncategorized')
        `,
        [userId],
      )
      for (const row of catRes.rows as { cat: string; count: number }[]) {
        categories[row.cat] = row.count
      }
    } catch {
      /* optional column shape differs */
    }

    const eventsRes = await db.query(`select count(*)::int as c from events where user_id = $1::uuid`, [userId])
    const eventsTotal = eventsRes.rows[0]?.c ?? 0

    let upcoming = 0
    try {
      const up = await db.query(
        `
        select count(*)::int as c
        from events
        where user_id = $1::uuid
          and event_date is not null
          and event_date::date >= (current_timestamp at time zone 'utc')::date
        `,
        [userId],
      )
      upcoming = up.rows[0]?.c ?? 0
    } catch {
      upcoming = 0
    }

    let emailsSent = 0
    try {
      const e = await db.query(
        `
        select count(*)::int as c
        from email_logs el
        inner join events ev on ev.id = el.event_id and ev.user_id = $1::uuid
        `,
        [userId],
      )
      emailsSent = e.rows[0]?.c ?? 0
    } catch {
      emailsSent = 0
    }

    let telegramSent = 0
    try {
      const t = await db.query(
        `
        select count(*)::int as c
        from telegram_logs tl
        inner join events ev on ev.id = tl.event_id and ev.user_id = $1::uuid
        `,
        [userId],
      )
      telegramSent = t.rows[0]?.c ?? 0
    } catch {
      telegramSent = 0
    }

    let balance = 0
    try {
      const b = await db.query(`select balance from user_balances where user_id = $1::uuid limit 1`, [userId])
      balance = Number(b.rows[0]?.balance ?? 0)
    } catch {
      balance = 0
    }

    let transactions = 0
    try {
      const tr = await db.query(`select count(*)::int as c from transactions where user_id = $1::uuid`, [userId])
      transactions = tr.rows[0]?.c ?? 0
    } catch {
      transactions = 0
    }

    let tier = "free"
    try {
      const s = await db.query(
        `select tier from user_subscriptions where user_id = $1::uuid order by created_at desc nulls last limit 1`,
        [userId],
      )
      tier = (s.rows[0]?.tier as string) || "free"
    } catch {
      tier = "free"
    }

    let lastActivity = new Date().toISOString()
    try {
      const em = await db.query(
        `select max(el.sent_at) as m from email_logs el inner join events ev on ev.id = el.event_id and ev.user_id = $1::uuid`,
        [userId],
      )
      const tg = await db.query(
        `select max(tl.sent_at) as m from telegram_logs tl inner join events ev on ev.id = tl.event_id and ev.user_id = $1::uuid`,
        [userId],
      )
      const t1 = em.rows[0]?.m ? new Date(em.rows[0].m as string).getTime() : 0
      const t2 = tg.rows[0]?.m ? new Date(tg.rows[0].m as string).getTime() : 0
      const best = Math.max(t1, t2)
      if (best > 0) lastActivity = new Date(best).toISOString()
    } catch {
      lastActivity = new Date().toISOString()
    }

    return NextResponse.json({
      account: {
        email,
        fullName: name,
        createdAt: createdAt || "",
        lastLogin: "",
      },
      contacts: {
        total: contactsTotal,
        categories,
      },
      events: {
        total: eventsTotal,
        upcoming,
        past: Math.max(0, eventsTotal - upcoming),
      },
      communications: {
        emailsSent,
        telegramSent,
        lastActivity,
      },
      financial: {
        balance,
        transactions,
        subscription: tier,
      },
    })
  } catch (error) {
    console.error("data-summary GET:", error)
    return NextResponse.json({ error: "Failed to load data summary" }, { status: 500 })
  }
}
