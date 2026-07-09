import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const userId = session.user.id
    const userResult = await db.query(
      `select id, email, full_name, created_at from users where id = $1 limit 1`,
      [userId],
    )
    const eventsResult = await db.query(
      `select count(*)::int as count from events where user_id = $1`,
      [userId],
    )
    const contactsResult = await db.query(
      `select count(*)::int as count from contacts where user_id = $1`,
      [userId],
    )
    const user = userResult.rows[0] ?? {
      id: userId,
      email: session.user.email ?? null,
      full_name: null,
      created_at: null,
    }

    return new NextResponse(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          created_at: user.created_at,
        },
        stats: {
          events: eventsResult.rows[0]?.count || 0,
          contacts: contactsResult.rows[0]?.count || 0,
        },
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('Error in dashboard summary:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
} 