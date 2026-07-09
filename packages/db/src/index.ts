import { Pool } from "pg"

declare global {
  // eslint-disable-next-line no-var
  var __repoDbPool: Pool | undefined
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is required")
}

export const db =
  global.__repoDbPool ??
  new Pool({
    connectionString,
    ssl: connectionString.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  })

if (process.env.NODE_ENV !== "production") {
  global.__repoDbPool = db
}
