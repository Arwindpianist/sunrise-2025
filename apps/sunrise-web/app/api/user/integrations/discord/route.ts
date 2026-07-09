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

    const { rows } = await db.query<{ discord_webhook_url: string | null }>(
      `select discord_webhook_url from users where id = $1::uuid limit 1`,
      [userId],
    )
    return NextResponse.json({ discord_webhook_url: rows[0]?.discord_webhook_url ?? null })
  } catch (e) {
    console.error("GET /api/user/integrations/discord:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const discord_webhook_url =
      body.discord_webhook_url === undefined ? undefined : (body.discord_webhook_url as string | null)

    if (discord_webhook_url === undefined) {
      return NextResponse.json({ error: "discord_webhook_url required" }, { status: 400 })
    }

    await db.query(
      `update users set discord_webhook_url = $2, updated_at = now() where id = $1::uuid`,
      [userId, discord_webhook_url],
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("PATCH /api/user/integrations/discord:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
