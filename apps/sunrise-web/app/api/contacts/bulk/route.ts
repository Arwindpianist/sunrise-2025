import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

type BulkBody =
  | { op: "update_category"; ids: string[]; category: string | null }
  | { op: "delete"; ids: string[] }

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as BulkBody
    if (!body || !body.op) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === "string" && id.length > 0) : []
    if (ids.length === 0) {
      return NextResponse.json({ error: "No contact ids provided" }, { status: 400 })
    }

    if (body.op === "update_category") {
      const category = body.category === null || body.category === "" ? "__no_category__" : body.category
      const { rowCount } = await db.query(
        `
        update contacts
        set category = $3
        where user_id = $1::uuid
          and id = any($2::uuid[])
        `,
        [userId, ids, category],
      )
      return NextResponse.json({ ok: true, updated: rowCount ?? 0 })
    }

    if (body.op === "delete") {
      const { rowCount } = await db.query(
        `
        delete from contacts
        where user_id = $1::uuid
          and id = any($2::uuid[])
        `,
        [userId, ids],
      )
      return NextResponse.json({ ok: true, deleted: rowCount ?? 0 })
    }

    return NextResponse.json({ error: "Unknown op" }, { status: 400 })
  } catch (e) {
    console.error("POST /api/contacts/bulk:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
