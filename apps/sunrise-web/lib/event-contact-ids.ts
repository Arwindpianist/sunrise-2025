import { db } from "@/lib/db"

/**
 * Resolves which contact rows belong to an event audience: "general" = all contacts,
 * otherwise match multi-category assignments first, then legacy `contacts.category` text.
 */
export async function getContactIdsForEventCategory(
  userId: string,
  categoryName: string | null | undefined,
): Promise<string[]> {
  const cat = (categoryName || "general").trim() || "general"

  if (cat === "general") {
    const r = await db.query<{ id: string }>(
      `select id from contacts where user_id = $1`,
      [userId],
    )
    return r.rows.map((row) => row.id)
  }

  const assigned = await db.query<{ id: string }>(
    `
    select distinct c.id
    from contacts c
    join contact_category_assignments cca on cca.contact_id = c.id
    join contact_categories cc on cc.id = cca.category_id
    where c.user_id = $1 and cc.name = $2
    `,
    [userId, cat],
  )

  if (assigned.rows.length > 0) {
    return assigned.rows.map((row) => row.id)
  }

  const legacy = await db.query<{ id: string }>(
    `
    select id from contacts
    where user_id = $1 and category is not null and category = $2
    `,
    [userId, cat],
  )

  return legacy.rows.map((row) => row.id)
}
