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

    const result = await db.query(
      `
      select id, user_id, webhook_url, message_content, status, error_message, created_at, updated_at
      from discord_logs
      where user_id = $1::uuid
      order by created_at desc nulls last
      limit 50
      `,
      [userId],
    )

    return NextResponse.json({ logs: result.rows })
  } catch (error: unknown) {
    const code = error && typeof error === "object" && "code" in error ? (error as { code?: string }).code : undefined
    if (code === "42P01") {
      return NextResponse.json({
        logs: [] as unknown[],
        unavailable: true,
        message: "Discord logs require the discord_logs table in your database.",
      })
    }
    console.error("discord-logs GET:", error)
    return NextResponse.json({ error: "Failed to load Discord logs" }, { status: 500 })
  }
}
