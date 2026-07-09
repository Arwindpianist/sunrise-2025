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

    const balanceRes = await db.query<{ balance: number }>(
      `select balance from user_balances where user_id = $1::uuid limit 1`,
      [userId],
    )
    const balance = balanceRes.rows[0]?.balance ?? 0

    const subRes = await db.query(
      `select tier, status, total_tokens_purchased, current_period_start, current_period_end, created_at
       from user_subscriptions where user_id = $1::uuid
       order by created_at desc nulls last
       limit 1`,
      [userId],
    )
    const subscription = subRes.rows[0] ?? null

    type TxRow = {
      id: string
      user_id: string
      type: string
      amount: number
      description: string | null
      status: string
      created_at: string
    }

    let transactionRows: TxRow[] = []
    try {
      const txRes = await db.query<TxRow>(
        `select id, user_id, type, amount, description, status, created_at
         from transactions
         where user_id = $1::uuid and status = 'completed'
         order by created_at desc nulls last`,
        [userId],
      )
      transactionRows = txRes.rows
    } catch (e: unknown) {
      const code = e && typeof e === "object" && "code" in e ? (e as { code?: string }).code : undefined
      if (code === "42P01") {
        console.warn(
          '[wallet] relation "transactions" does not exist; returning empty history. Apply db/migrations/0001_create_transactions.sql',
        )
      } else {
        throw e
      }
    }

    const userRes = await db.query<{ created_at: string }>(
      `select created_at from users where id = $1::uuid limit 1`,
      [userId],
    )
    const accountCreatedAt = userRes.rows[0]?.created_at ?? null

    return NextResponse.json({
      balance,
      subscription,
      transactions: transactionRows,
      accountCreatedAt,
    })
  } catch (e) {
    console.error("GET /api/user/wallet:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
