'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
type AppUser = {
  id: string
  email?: string | null
}

type SupabaseContext = {
  supabase: any
  user: AppUser | null
}

const Context = createContext<SupabaseContext | undefined>(undefined)

/** PostgREST-shaped error returned when client code still calls `.from()` after Neon migration. */
export const CLIENT_DB_DISABLED_ERROR = {
  message:
    "Direct database access from the browser is disabled. Use fetch() to a Next.js route under /api/... (server uses Neon via db or the server compat layer).",
  code: "client_db_disabled",
  details: null,
  hint: null,
} as const

/**
 * Chainable no-op builder: never silently returns fake rows (that caused null derefs and false success).
 * Always resolves with `error: CLIENT_DB_DISABLED_ERROR` so `if (error)` paths fire.
 */
class ClientQueryBuilder {
  private singleMode = false
  private maybeSingleMode = false
  private headMode = false
  private includeCount = false

  select(_columns?: string, options?: { count?: "exact"; head?: boolean }) {
    this.headMode = !!options?.head
    this.includeCount = options?.count === "exact"
    return this
  }

  insert(_values?: unknown) {
    return this
  }

  upsert(_values?: unknown, _options?: { onConflict?: string }) {
    return this
  }

  update(_values?: Record<string, unknown>) {
    return this
  }

  delete() {
    return this
  }

  eq(_field: string, _value: unknown) {
    return this
  }

  neq(_field: string, _value: unknown) {
    return this
  }

  in(_field: string, _value: unknown[]) {
    return this
  }

  not(_column: string, _operator: string, _value: unknown) {
    return this
  }

  is(_column: string, _value: unknown) {
    return this
  }

  or(_filters: string) {
    return this
  }

  filter(_column: string, _operator: string, _value: unknown) {
    return this
  }

  match(_query: Record<string, unknown>) {
    return this
  }

  ilike(_column: string, _pattern: string) {
    return this
  }

  like(_column: string, _pattern: string) {
    return this
  }

  gte(_column: string, _value: unknown) {
    return this
  }

  lte(_column: string, _value: unknown) {
    return this
  }

  gt(_column: string, _value: unknown) {
    return this
  }

  lt(_column: string, _value: unknown) {
    return this
  }

  textSearch(_column: string, _query: string) {
    return this
  }

  order(_column: string, _options?: { ascending?: boolean }) {
    return this
  }

  range(_from: number, _to: number) {
    return this
  }

  limit(_value: number) {
    return this
  }

  single() {
    this.singleMode = true
    return this
  }

  maybeSingle() {
    this.singleMode = true
    this.maybeSingleMode = true
    return this
  }

  async then(resolve: (value: unknown) => void) {
    if (process.env.NODE_ENV === "development") {
      console.error("[sunrise-web]", CLIENT_DB_DISABLED_ERROR.message)
    }
    resolve({
      data: this.singleMode ? null : [],
      error: { ...CLIENT_DB_DISABLED_ERROR },
      count: this.includeCount ? null : null,
      head: this.headMode,
    })
  }
}

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (session?.user?.id) {
      setUser({
        id: session.user.id,
        email: session.user.email,
      })
    } else {
      setUser(null)
    }

    setIsLoading(false)

  }, [status, session, pathname])

  const supabase = {
    auth: {
      getSession: async () => ({
        data: {
          session: session?.user?.id
            ? { user: { id: session.user.id, email: session.user.email } }
            : null,
        },
      }),
      signOut: async () => {
        await signOut({ callbackUrl: '/' })
      },
      getUser: async () => ({
        data: {
          user: session?.user?.id
            ? { id: session.user.id, email: session.user.email }
            : null,
        },
      }),
    },
    from: () => new ClientQueryBuilder(),
  }

  if (isLoading) {
    return null // or a loading spinner
  }

  return (
    <Context.Provider value={{ supabase, user }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }
  return context
} 