import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { sendTokenLimitWarning } from '@/lib/zoho-email'
import { getTokenLimit } from '@/lib/token-limits'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { tier, currentBalance } = await request.json()
    const userId = session.user.id

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (userError || !user?.email) {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), { status: 404 })
    }

    // Send token limit warning email
    const limit = getTokenLimit(tier)
    const success = await sendTokenLimitWarning(
      user.email,
      user.full_name || 'User',
      tier,
      currentBalance,
      limit
    )

    if (success) {
      return new NextResponse(JSON.stringify({ 
        success: true, 
        message: 'Token limit warning email sent successfully' 
      }), {
        headers: { 'Content-Type': 'application/json' },
      })
    } else {
      return new NextResponse(JSON.stringify({ 
        error: 'Failed to send email' 
      }), { status: 500 })
    }

  } catch (error) {
    console.error('Error sending token limit warning email:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 