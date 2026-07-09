import { db } from "@/lib/db"

type QueryPayload<T = any> = { data: T; error: any; count?: number | null }

class QueryBuilder {
  private table: string
  private filters: Array<{ field: string; op: "=" | "in"; value: any }> = []
  private selectedColumns: string = "*"
  private headOnly = false
  private withCount = false
  private limitValue: number | null = null
  private orderBy: { column: string; ascending: boolean } | null = null
  private singleResult = false
  private pendingOp: "select" | "insert" | "update" | "delete" = "select"
  private pendingData: Record<string, any>[] | null = null
  private upsertConflictColumn: string | null = null

  constructor(table: string) {
    this.table = table
  }

  select(columns?: string, options?: { count?: "exact"; head?: boolean }) {
    // Supabase allows .insert().select() / .update().select() / .delete().select(); keep the pending op.
    if (this.pendingOp === "insert" || this.pendingOp === "update" || this.pendingOp === "delete") {
      if (columns) this.selectedColumns = columns.includes("(") ? "*" : columns
      return this
    }
    this.pendingOp = "select"
    if (columns) this.selectedColumns = columns.includes("(") ? "*" : columns
    this.headOnly = !!options?.head
    this.withCount = options?.count === "exact"
    return this
  }

  eq(field: string, value: any) {
    this.filters.push({ field, op: "=", value })
    return this
  }

  in(field: string, value: any[]) {
    this.filters.push({ field, op: "in", value })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending !== false }
    return this
  }

  range(from: number, to: number) {
    this.limitValue = Math.max(0, to - from + 1)
    return this
  }

  limit(value: number) {
    this.limitValue = value
    return this
  }

  single() {
    this.singleResult = true
    this.limitValue = this.limitValue ?? 1
    return this
  }

  insert(values: Record<string, any> | Record<string, any>[]) {
    this.pendingOp = "insert"
    this.pendingData = Array.isArray(values) ? values : [values]
    return this
  }

  upsert(values: Record<string, any> | Record<string, any>[], options?: { onConflict?: string }) {
    this.pendingOp = "insert"
    this.pendingData = Array.isArray(values) ? values : [values]
    this.upsertConflictColumn = options?.onConflict ?? null
    return this
  }

  update(values: Record<string, any>) {
    this.pendingOp = "update"
    this.pendingData = [values]
    return this
  }

  delete() {
    this.pendingOp = "delete"
    return this
  }

  private buildWhereClause(startIndex = 1) {
    if (!this.filters.length) {
      return { whereClause: "", params: [] as any[] }
    }
    const parts: string[] = []
    const params: any[] = []
    let idx = startIndex
    for (const filter of this.filters) {
      if (filter.op === "=") {
        parts.push(`${filter.field} = $${idx}`)
        params.push(filter.value)
        idx += 1
      } else {
        const placeholders = filter.value.map(() => `$${idx++}`).join(",")
        parts.push(`${filter.field} in (${placeholders})`)
        params.push(...filter.value)
      }
    }
    return { whereClause: `where ${parts.join(" and ")}`, params }
  }

  private async execute(): Promise<QueryPayload<any>> {
    try {
      if (this.pendingOp === "insert") {
        const rowsToInsert = this.pendingData ?? []
        const inserted: any[] = []
        for (const row of rowsToInsert) {
          const keys = Object.keys(row)
          const values = keys.map((k) => row[k])
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ")
          const conflict = this.upsertConflictColumn
            ? `on conflict (${this.upsertConflictColumn}) do update set ${keys
                .filter((k) => k !== this.upsertConflictColumn)
                .map((k) => `${k} = excluded.${k}`)
                .join(", ")}`
            : ""
          const returning = this.selectedColumns || "*"
          const sql = `insert into ${this.table} (${keys.join(", ")}) values (${placeholders}) ${conflict} returning ${returning}`
          const { rows } = await db.query(sql, values)
          inserted.push(...rows)
        }
        return { data: this.singleResult ? inserted[0] ?? null : inserted, error: null }
      }

      if (this.pendingOp === "update") {
        const valuesObj = this.pendingData?.[0] ?? {}
        const setKeys = Object.keys(valuesObj)
        const setClause = setKeys.map((k, i) => `${k} = $${i + 1}`).join(", ")
        const where = this.buildWhereClause(setKeys.length + 1)
        const returning = this.selectedColumns || "*"
        const sql = `update ${this.table} set ${setClause} ${where.whereClause} returning ${returning}`
        const { rows } = await db.query(sql, [...setKeys.map((k) => valuesObj[k]), ...where.params])
        return { data: this.singleResult ? rows[0] ?? null : rows, error: null }
      }

      if (this.pendingOp === "delete") {
        const where = this.buildWhereClause(1)
        const returning = this.selectedColumns || "*"
        const sql = `delete from ${this.table} ${where.whereClause} returning ${returning}`
        const { rows } = await db.query(sql, where.params)
        return { data: this.singleResult ? rows[0] ?? null : rows, error: null }
      }

      const where = this.buildWhereClause(1)
      const countSql = this.withCount ? `select count(*)::int as c from ${this.table} ${where.whereClause}` : ""
      const countResult = this.withCount ? await db.query(countSql, where.params) : null
      const orderClause = this.orderBy
        ? `order by ${this.orderBy.column} ${this.orderBy.ascending ? "asc" : "desc"}`
        : ""
      const limitClause = this.limitValue ? `limit ${this.limitValue}` : ""
      const sql = `select ${this.selectedColumns} from ${this.table} ${where.whereClause} ${orderClause} ${limitClause}`
      const { rows } = this.headOnly
        ? { rows: [] as any[] }
        : await db.query(sql, where.params)
      const count = countResult?.rows?.[0]?.c ?? null
      return {
        data: this.singleResult ? rows[0] ?? null : rows,
        error: null,
        count,
      }
    } catch (error) {
      return {
        data: this.singleResult ? null : [],
        error,
        count: null,
      }
    }
  }

  async then(resolve: any, reject: any) {
    const result = await this.execute()
    if (result.error) reject?.(result.error)
    else resolve(result)
  }
}

export function createClient() {
  return {
    auth: {
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
      signUp: async () => ({ data: { user: null, session: null }, error: null }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      resetPasswordForEmail: async () => ({ data: null, error: null }),
      updateUser: async () => ({ data: null, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      admin: {
        listUsers: async () => ({ data: { users: [] }, error: null }),
        deleteUser: async () => ({ data: { user: null }, error: null }),
        updateUserById: async () => ({ data: { user: null }, error: null }),
        signOut: async () => ({ error: null }),
      },
    },
    from: (table: string) => new QueryBuilder(table),
    rpc: async () => ({ data: null, error: null }),
  }
}
