import { NextRequest, NextResponse } from 'next/server'
import { canCreateContact, canCreateEvent } from '@/lib/subscription-limits'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'contacts'

    if (type === 'contacts') {
      const result = await canCreateContact()
      return NextResponse.json(result)
    } else if (type === 'events') {
      const result = await canCreateEvent()
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { error: 'Invalid type parameter. Use "contacts" or "events".' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in subscription limits API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 