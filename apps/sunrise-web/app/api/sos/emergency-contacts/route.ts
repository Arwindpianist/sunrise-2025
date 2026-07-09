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

    const { rows } = await db.query(
      `select ec.id, ec.user_id, ec.contact_id, ec.is_active, ec.priority, ec.created_at, ec.updated_at,
              row_to_json(c.*) as contact
       from emergency_contacts ec
       join contacts c on c.id = ec.contact_id
       where ec.user_id = $1::uuid and ec.is_active = true
       order by ec.priority asc nulls last, ec.created_at asc`,
      [userId],
    )

    return NextResponse.json(rows)
  } catch (e) {
    console.error("GET /api/sos/emergency-contacts:", e)
    return NextResponse.json({ error: "Failed to load emergency contacts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const contact_id = body.contact_id as string | undefined
    const priority = typeof body.priority === "number" ? body.priority : parseInt(String(body.priority || "1"), 10)

    if (!contact_id) {
      return NextResponse.json({ error: "contact_id required" }, { status: 400 })
    }

    const own = await db.query(`select id from contacts where id = $1::uuid and user_id = $2::uuid limit 1`, [
      contact_id,
      userId,
    ])
    if (!own.rows.length) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    await db.query(
      `insert into emergency_contacts (id, user_id, contact_id, is_active, priority, created_at, updated_at)
       values (gen_random_uuid(), $1::uuid, $2::uuid, true, $3, now(), now())`,
      [userId, contact_id, priority],
    )

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "Emergency contact already exists" }, { status: 409 })
    }
    console.error("POST /api/sos/emergency-contacts:", e)
    return NextResponse.json({ error: "Failed to add emergency contact" }, { status: 500 })
  }
}
