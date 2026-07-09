import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

/** Legacy debug endpoint: compares admin vs excluded user data using Neon. */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const callerId = session?.user?.id
    if (!callerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminRow = await db.query(
      `select subscription_plan from users where id = $1::uuid limit 1`,
      [callerId],
    )
    const plan = (adminRow.rows[0] as { subscription_plan?: string | null } | undefined)?.subscription_plan
    if (plan !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const excludedUserId = "dd353545-03e8-43ad-a7a7-0715ebe7d765"

    let user: Record<string, unknown> | null = null
    let userError: string | null = null
    let subscription: Record<string, unknown> | null = null
    let subscriptionError: string | null = null
    let events: Record<string, unknown>[] = []
    let eventsError: string | null = null
    let contacts: Record<string, unknown>[] = []
    let contactsError: string | null = null
    let transactions: Record<string, unknown>[] = []
    let transactionsError: string | null = null

    try {
      const r = await db.query(`select * from users where id = $1::uuid limit 1`, [excludedUserId])
      user = (r.rows[0] as Record<string, unknown>) ?? null
      if (!user) userError = "User not found"
    } catch (e: unknown) {
      userError = e instanceof Error ? e.message : "Failed to load user"
    }

    try {
      const r = await db.query(
        `select * from user_subscriptions where user_id = $1::uuid order by created_at desc nulls last limit 1`,
        [excludedUserId],
      )
      subscription = (r.rows[0] as Record<string, unknown>) ?? null
      if (!subscription) subscriptionError = "No subscription row"
    } catch (e: unknown) {
      subscriptionError = e instanceof Error ? e.message : "Failed to load subscription"
    }

    try {
      const r = await db.query(`select * from events where user_id = $1::uuid`, [excludedUserId])
      events = r.rows as Record<string, unknown>[]
    } catch (e: unknown) {
      eventsError = e instanceof Error ? e.message : "Failed to load events"
    }

    try {
      const r = await db.query(`select * from contacts where user_id = $1::uuid`, [excludedUserId])
      contacts = r.rows as Record<string, unknown>[]
    } catch (e: unknown) {
      contactsError = e instanceof Error ? e.message : "Failed to load contacts"
    }

    try {
      const r = await db.query(`select * from transactions where user_id = $1::uuid`, [excludedUserId])
      transactions = r.rows as Record<string, unknown>[]
    } catch (e: unknown) {
      transactionsError = e instanceof Error ? e.message : "Failed to load transactions"
    }

    return NextResponse.json({
      excludedUserId,
      user,
      userError,
      subscription,
      subscriptionError,
      events: {
        count: events.length,
        data: events,
      },
      eventsError,
      contacts: {
        count: contacts.length,
        data: contacts,
      },
      contactsError,
      transactions: {
        count: transactions.length,
        data: transactions,
      },
      transactionsError,
    })
  } catch (error) {
    console.error("Error checking user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
