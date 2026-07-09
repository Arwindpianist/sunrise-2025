import { randomBytes, createHash } from "crypto"
import { hash } from "bcryptjs"
import { db } from "@/lib/db"

const TOKEN_TTL_MS = 1000 * 60 * 60

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

async function ensurePasswordResetTable() {
  await db.query(`
    create table if not exists password_reset_tokens (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references users(id) on delete cascade,
      token_hash text not null unique,
      expires_at timestamptz not null,
      used_at timestamptz,
      created_at timestamptz not null default now()
    )
  `)
}

export async function issuePasswordResetToken(email: string) {
  await ensurePasswordResetTable()
  const { rows } = await db.query<{ id: string; email: string }>(
    `select id, email from users where lower(email) = lower($1) limit 1`,
    [email],
  )

  const user = rows[0]
  if (!user) {
    return null
  }

  const rawToken = randomBytes(32).toString("hex")
  const tokenHash = sha256(rawToken)
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString()

  await db.query(`delete from password_reset_tokens where user_id = $1`, [user.id])
  await db.query(
    `insert into password_reset_tokens (user_id, token_hash, expires_at) values ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt],
  )

  return { rawToken, email: user.email }
}

export async function resetPasswordWithToken(token: string, password: string) {
  await ensurePasswordResetTable()
  const tokenHash = sha256(token)
  const { rows } = await db.query<{ user_id: string; expires_at: string; used_at: string | null }>(
    `select user_id, expires_at, used_at from password_reset_tokens where token_hash = $1 limit 1`,
    [tokenHash],
  )

  const resetRow = rows[0]
  if (!resetRow) {
    return { ok: false as const, reason: "invalid" as const }
  }

  if (resetRow.used_at || new Date(resetRow.expires_at).getTime() < Date.now()) {
    return { ok: false as const, reason: "expired" as const }
  }

  const passwordHash = await hash(password, 12)
  await db.query(`update users set password_hash = $1, updated_at = now() where id = $2`, [
    passwordHash,
    resetRow.user_id,
  ])
  await db.query(`update password_reset_tokens set used_at = now() where token_hash = $1`, [tokenHash])

  return { ok: true as const }
}
