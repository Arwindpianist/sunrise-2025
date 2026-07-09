import { NextResponse } from 'next/server'
import { canCreateContact } from '@/lib/subscription-limits'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
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

    let rows: Record<string, unknown>[]

    try {
      const result = await db.query(
        `
        select
          c.*,
          coalesce(
            json_agg(
              json_build_object(
                'id', cc.id,
                'name', cc.name,
                'color', cc.color
              )
            ) filter (where cc.id is not null),
            '[]'::json
          ) as categories
        from contacts c
        left join contact_category_assignments cca on cca.contact_id = c.id
        left join contact_categories cc on cc.id = cca.category_id
        where c.user_id = $1::uuid
        group by c.id
        order by coalesce(c.created_at, to_timestamp(0)) desc nulls last
        `,
        [userId],
      )
      rows = result.rows as Record<string, unknown>[]
    } catch (aggErr) {
      console.error('Contacts aggregated query failed, using Neon legacy fallback:', aggErr)
      const result = await db.query(
        `
        select c.*, '[]'::json as categories
        from contacts c
        where c.user_id = $1::uuid
        order by coalesce(c.created_at, to_timestamp(0)) desc nulls last
        `,
        [userId],
      )
      rows = result.rows as Record<string, unknown>[]
    }

    const transformedContacts = rows.map((contact) => ({
      ...contact,
      category: (contact.category as string | undefined) || '__no_category__',
    }))

    return new NextResponse(
      JSON.stringify(transformedContacts),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('Error in contacts:', error)
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

export async function POST(request: Request) {
  try {
    console.log('=== CONTACTS API START ===')
    
    const session = await getServerSession(authOptions)
    console.log('Session check:', { hasSession: !!session })

    const body = await request.json()
    console.log('Request body:', body)
    
    const { first_name, last_name, email, phone, telegram_chat_id, category, categories, notes, user_id } = body

    // Determine the user_id - either from session or from the form (for public contact forms)
    let targetUserId: string
    if (user_id) {
      // Public contact form submission
      targetUserId = user_id
      console.log('Public contact form submission for user:', targetUserId)
    } else if (session?.user?.id) {
      // Authenticated user submission
      targetUserId = session.user.id
      console.log('Authenticated user submission for user:', targetUserId)
    } else {
      console.log('No user context provided')
      return new NextResponse(
        JSON.stringify({ error: 'No user context provided for contact submission' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Validate required fields
    if (!first_name || !email) {
      console.log('Validation failed: missing first_name or email')
      return new NextResponse(
        JSON.stringify({ error: 'Full name and email are required' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('Validation failed: invalid email format')
      return new NextResponse(
        JSON.stringify({ error: 'Please enter a valid email address' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Validate telegram_chat_id if provided (should be numeric)
    if (telegram_chat_id && !/^\d+$/.test(telegram_chat_id)) {
      console.log('Validation failed: invalid telegram_chat_id')
      return new NextResponse(
        JSON.stringify({ error: 'Telegram Chat ID should be a number' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Check contact creation limit (only for authenticated users, not public forms)
    if (session?.user?.id && !user_id) {
      console.log('Checking contact limits for authenticated user')
      const limitCheck = await canCreateContact()
      
      if (!limitCheck.allowed) {
        const limitInfo = limitCheck.maxAllowed === -1 ? 'unlimited' : limitCheck.maxAllowed
        console.log('Contact limit reached')
        return new NextResponse(
          JSON.stringify({ 
            error: `Contact limit reached. You can only create up to ${limitInfo} contacts with your current plan.`,
            limitReached: true,
            currentCount: limitCheck.currentCount,
            maxAllowed: limitCheck.maxAllowed,
            tier: limitCheck.tier
          }),
          { 
            status: 403,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      }
    }

    // Handle categories - support both old single category and new multiple categories
    let primaryCategory = category || '__no_category__'
    let categoryIds: string[] = []
    
    if (categories && Array.isArray(categories) && categories.length > 0) {
      categoryIds = categories
      // Use the first category as the primary category for backward compatibility
      if (categories.length > 0) {
        primaryCategory = categories[0]
      }
    } else if (category && category !== '__no_category__') {
      // For backward compatibility, if only single category is provided
      primaryCategory = category
    }

    console.log('About to insert contact with data:', {
      user_id: targetUserId,
      first_name,
      last_name,
      email,
      phone,
      telegram_chat_id,
      category: primaryCategory,
      notes,
      categoryIds,
    })

    const insertResult = await db.query(
      `
      insert into contacts (
        id, user_id, first_name, last_name, email, phone, telegram_chat_id, category, notes, created_at
      )
      values (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, now()
      )
      returning *
      `,
      [
        targetUserId,
        first_name,
        last_name ?? null,
        email,
        phone ?? null,
        telegram_chat_id ?? null,
        primaryCategory,
        notes ?? null,
      ],
    )
    const contact = insertResult.rows[0]

    // Create category assignments if categories are provided
    if (categoryIds.length > 0) {
      try {
        for (const categoryId of categoryIds) {
          await db.query(
            `
            insert into contact_category_assignments (id, contact_id, category_id, created_at)
            values (gen_random_uuid(), $1, $2, now())
            on conflict do nothing
            `,
            [contact.id, categoryId],
          )
        }
      } catch (assignmentError) {
        console.error('Error in category assignment creation:', assignmentError)
        // Don't fail the entire request, just log the error
      }
    }

    console.log('Contact created successfully:', contact)
    console.log('=== CONTACTS API END ===')

    return new NextResponse(
      JSON.stringify({
        success: true,
        contact,
        message: 'Contact created successfully'
      }),
      { 
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('=== CONTACTS API ERROR ===')
    console.error('Error in contacts:', error)
    console.error('Error stack:', error.stack)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
} 