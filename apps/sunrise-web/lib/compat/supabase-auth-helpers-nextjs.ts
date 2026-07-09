import { createClient } from "@/lib/compat/supabase-js"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export type User = {
  id: string
  email?: string | null
}

export type SupabaseClient<T = any> = ReturnType<typeof createClient>

export function createRouteHandlerClient(_args?: any) {
  const client = createClient()
  return {
    ...client,
    auth: {
      ...client.auth,
      getSession: async () => {
        const session = await getServerSession(authOptions)
        return {
          data: {
            session: session?.user?.id
              ? { user: { id: session.user.id, email: session.user.email } }
              : null,
          },
          error: null,
        }
      },
      getUser: async () => {
        const session = await getServerSession(authOptions)
        return {
          data: {
            user: session?.user?.id
              ? { id: session.user.id, email: session.user.email }
              : null,
          },
          error: null,
        }
      },
      admin: {
        ...client.auth.admin,
        listUsers: async () => {
          const { rows } = await db.query(
            `select id, email, full_name from users order by created_at desc`,
          )
          return { data: { users: rows }, error: null }
        },
      },
    },
  }
}

export function createClientComponentClient<T = any>(_args?: any) {
  return createClient()
}

export function createMiddlewareClient(_args?: any) {
  return createClient()
}
