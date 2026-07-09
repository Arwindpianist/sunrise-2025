import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and password are required' 
      }, { status: 400 })
    }

    const passwordHash = await hash(password, 12)
    const userId = crypto.randomUUID()
    const now = new Date().toISOString()

    await db.query('BEGIN')
    let userData = null as Record<string, unknown> | null
    try {
      const existing = await db.query(
        `select id from users where lower(email) = lower($1) limit 1`,
        [email],
      )
      if (existing.rowCount) {
        await db.query('ROLLBACK')
        return NextResponse.json(
          { success: false, error: 'User with this email already exists' },
          { status: 400 },
        )
      }

      const insertedUser = await db.query(
        `
        insert into users (
          id, email, full_name, subscription_plan, token_balance, created_at, updated_at, password_hash
        )
        values ($1, $2, $3, 'free', 0, $4, $4, $5)
        returning id, email, full_name, created_at
        `,
        [userId, email, fullName || '', now, passwordHash],
      )
      userData = insertedUser.rows[0] ?? null

      await db.query(
        `
        insert into user_balances (user_id, balance, created_at, updated_at)
        values ($1, 15, $2, $2)
        on conflict (user_id) do nothing
        `,
        [userId, now],
      )

      await db.query('COMMIT')
    } catch (dbError) {
      await db.query('ROLLBACK')
      throw dbError
    }

    const response = {
      success: true,
      user: {
        id: userId,
        email,
        created_at: now,
      },
      userRecord: userData || null,
      message: 'User created successfully'
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Server-side signup error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    })
    return NextResponse.json(
      { 
        success: false, 
        error: 'Server-side signup failed',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}
