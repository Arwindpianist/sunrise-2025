import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // Use service role client for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { referrerId, email } = await request.json()

    if (!referrerId || !email) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify the referrer exists
    const { data: referrer, error: referrerError } = await supabase
      .from('users')
      .select('id')
      .eq('id', referrerId)
      .single()

    if (referrerError || !referrer) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid referrer' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if referral already exists
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrerId)
      .eq('referred_email', email)
      .single()

    if (existingReferral) {
      return new NextResponse(
        JSON.stringify({ error: 'Referral already exists' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Create referral record
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_email: email,
        status: 'pending',
        tokens_awarded: 0
      })
      .select()
      .single()

    if (referralError) {
      console.error('Error creating referral:', referralError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to create referral' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return NextResponse.json({ 
      success: true, 
      referral 
    })

  } catch (error: any) {
    console.error('Error in referral creation:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 