import { db } from "@/lib/db"

function isUndefinedTable(err: unknown, relationSnippet: string): boolean {
  const e = err as { code?: string; message?: string }
  return e?.code === "42P01" && (e.message ?? "").includes(relationSnippet)
}

/**
 * Lists events with audience size. Prefers `event_contacts` counts when that table exists (Neon schema after full migration).
 */
export async function fetchEventsRowsForUser(userId: string) {
  try {
    const r = await db.query(
      `
      select
        e.*,
        coalesce(ec.n, 0)::int as contact_count
      from events e
      left join lateral (
        select count(*)::int as n
        from event_contacts x
        where x.event_id = e.id
      ) ec on true
      where e.user_id = $1::uuid
      order by coalesce(e.created_at, e.event_date::timestamptz, to_timestamp(0)) desc nulls last
      `,
      [userId],
    )
    return r.rows
  } catch (e) {
    if (!isUndefinedTable(e, "event_contacts")) throw e
  }

  try {
    const r = await db.query(
      `
      select
        e.*,
        (
          case
            when e.category is null or trim(coalesce(e.category, '')) = ''
              or lower(trim(e.category)) = 'general' then
              (select count(*)::int from contacts c where c.user_id = e.user_id)
            else
              coalesce(
                (
                  select count(distinct c.id)::int
                  from contacts c
                  inner join contact_category_assignments cca on cca.contact_id = c.id
                  inner join contact_categories cc on cc.id = cca.category_id
                  where c.user_id = e.user_id and cc.name = e.category
                ),
                (
                  select count(*)::int from contacts c
                  where c.user_id = e.user_id
                    and c.category is not null
                    and c.category = e.category
                ),
                0
              )
          end
        )::int as contact_count
      from events e
      where e.user_id = $1::uuid
      order by coalesce(e.created_at, e.event_date::timestamptz, to_timestamp(0)) desc nulls last
      `,
      [userId],
    )
    return r.rows
  } catch (e) {
    if (
      !isUndefinedTable(e, "contact_category_assignments") &&
      !isUndefinedTable(e, "contact_categories")
    ) {
      throw e
    }
  }

  const r = await db.query(
    `
    select
      e.*,
      (
        case
          when e.category is null or trim(coalesce(e.category, '')) = ''
            or lower(trim(e.category)) = 'general' then
            (select count(*)::int from contacts c where c.user_id = e.user_id)
          else
            (select count(*)::int from contacts c
             where c.user_id = e.user_id and c.category = e.category)
        end
      )::int as contact_count
    from events e
    where e.user_id = $1::uuid
    order by coalesce(e.created_at, e.event_date::timestamptz, to_timestamp(0)) desc nulls last
    `,
    [userId],
  )
  return r.rows
}
