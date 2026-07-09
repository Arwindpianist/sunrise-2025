import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@repo/db"
import { verifyPassword } from "./password-verify"

type AppUser = {
  id: string
  email: string
  full_name: string | null
  password_hash: string | null
  deleted: boolean | null
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null
        }

        const { rows } = await db.query<AppUser>(
          `
          select id, email, full_name, password_hash, deleted
          from users
          where lower(email) = lower($1)
          limit 1
          `,
          [credentials.email],
        )
        const user = rows[0]
        if (!user || !user.password_hash || user.deleted) {
          return null
        }

        const isValid = await verifyPassword(
          credentials.password,
          user.password_hash,
        )
        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.full_name ?? undefined,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}
