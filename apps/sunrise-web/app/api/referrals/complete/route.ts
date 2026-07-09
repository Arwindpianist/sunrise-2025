import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const { referralId } = await request.json()

    if (!referralId) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing referral ID' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Get the referral
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('*')
      .eq('id', referralId)
      .single()

    if (referralError || !referral) {
      return new NextResponse(
        JSON.stringify({ error: 'Referral not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if referral is already completed
    if (referral.status === 'completed') {
      return new NextResponse(
        JSON.stringify({ error: 'Referral already completed' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Start a transaction to update referral and award tokens
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        status: 'completed',
        tokens_awarded: 10,
        completed_at: new Date().toISOString()
      })
      .eq('id', referralId)

    if (updateError) {
      console.error('Error updating referral:', updateError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to update referral' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Award tokens to the referrer
    const { error: balanceError } = await supabase
      .from('user_balances')
      .upsert({
        user_id: referral.referrer_id,
        balance: 10
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })

    if (balanceError) {
      console.error('Error updating user balance:', balanceError)
      // Try to increment existing balance
      const { error: incrementError } = await supabase.rpc('increment_balance', {
        user_id: referral.referrer_id,
        amount: 10
      })

      if (incrementError) {
        console.error('Error incrementing balance:', incrementError)
        return new NextResponse(
          JSON.stringify({ error: 'Failed to award tokens' }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Create a transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: referral.referrer_id,
        type: 'referral_reward',
        amount: 10,
        description: `Referral reward for ${referral.referred_email}`,
        status: 'completed'
      })

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError)
      // Don't fail the request for this, just log it
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Referral completed and tokens awarded'
    })

  } catch (error: any) {
    console.error('Error completing referral:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 