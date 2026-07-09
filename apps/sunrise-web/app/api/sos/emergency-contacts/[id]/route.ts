import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const { rowCount } = await db.query(
      `delete from emergency_contacts where id = $1::uuid and user_id = $2::uuid`,
      [id, userId],
    )
    if (!rowCount) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/sos/emergency-contacts/[id]:", e)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const priority = typeof body.priority === "number" ? body.priority : parseInt(String(body.priority), 10)
    if (Number.isNaN(priority)) {
      return NextResponse.json({ error: "priority required" }, { status: 400 })
    }

    const { rowCount } = await db.query(
      `update emergency_contacts set priority = $3, updated_at = now()
       where id = $1::uuid and user_id = $2::uuid`,
      [id, userId, priority],
    )
    if (!rowCount) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("PATCH /api/sos/emergency-contacts/[id]:", e)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}
