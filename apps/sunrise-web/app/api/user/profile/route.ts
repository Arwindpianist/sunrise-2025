import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { unstable_cache } from "next/cache"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

/** Single-row profile fields used by shell chrome (avoid duplicate queries from Header + Dashboard). */
async function loadProfileRow(userId: string): Promise<{ full_name: string | null }> {
  const result = await db.query(`select full_name from users where id = $1 limit 1`, [userId])
  const row = result.rows[0] as { full_name: string | null } | undefined
  return { full_name: row?.full_name ?? null }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    const profile = await unstable_cache(
      () => loadProfileRow(userId),
      ["user-profile", userId],
      { revalidate: 60, tags: [`user-profile-${userId}`] },
    )()

    return NextResponse.json(profile, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
      },
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
