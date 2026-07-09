import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const result = await db.query(
      `select id, email, full_name, password_hash, deleted from users where lower(email)=lower($1) limit 1`,
      [email],
    )
    const user = result.rows[0]

    if (!user || !user.password_hash || user.deleted) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 })
    }
    const valid = await compare(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 })
    }

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 