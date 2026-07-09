import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { rows } = await db.query<{ balance: number }>(
      `select balance from user_balances where user_id = $1 limit 1`,
      [session.user.id],
    )

    const balance = rows[0]?.balance ?? 0

    return NextResponse.json({ balance, success: true })
  } catch (error) {
    console.error("Error fetching user balance:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
