import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json()
    const existing = await db.query(
      `select id from users where lower(email)=lower($1) limit 1`,
      [email],
    )
    if (existing.rowCount) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }
    const passwordHash = await hash(password, 12)
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const inserted = await db.query(
      `
      insert into users (
        id, email, full_name, subscription_plan, token_balance, created_at, updated_at, password_hash
      ) values ($1, $2, $3, 'free', 0, $4, $4, $5)
      returning id, email, full_name, created_at
      `,
      [id, email, fullName || '', now, passwordHash],
    )

    return NextResponse.json({ 
      message: 'Registration successful',
      user: inserted.rows[0] 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 