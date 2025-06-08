import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: Request,
  { params }: { params: { contactId: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to get session' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

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

    // Delete contact
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', params.contactId)
      .eq('user_id', session.user.id)

    if (deleteError) {
      console.error('Error deleting contact:', deleteError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to delete contact' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    return new NextResponse(
      JSON.stringify({ message: 'Contact deleted successfully' }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('Error in delete contact:', error)
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