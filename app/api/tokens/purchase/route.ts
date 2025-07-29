import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { canPurchaseTokens, getTokenLimitInfo, shouldWarnAboutTokenLimit } from '@/lib/token-limits'
import { sendTokenLimitWarning } from '@/lib/zoho-email'
import { SUBSCRIPTION_FEATURES } from '@/lib/subscription'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { amount, paymentMethod } = await request.json()
    const userId = session.user.id

    if (!amount || amount <= 0) {
      return new NextResponse(JSON.stringify({ error: 'Invalid token amount' }), { status: 400 })
    }

    // Get user's current subscription and balance
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    const { data: balance } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single()

    const currentTier = subscription?.tier || 'free'
    const currentBalance = balance?.balance || 0

    // Validate token purchase
    const validation = canPurchaseTokens(currentTier, currentBalance, amount)
    
    if (!validation.canPurchase) {
      return new NextResponse(JSON.stringify({ 
        error: validation.reason,
        suggestedAmount: validation.suggestedAmount,
        limitInfo: validation.limitInfo
      }), { status: 400 })
    }

    // Calculate token price
    const tokenPrice = SUBSCRIPTION_FEATURES[currentTier as keyof typeof SUBSCRIPTION_FEATURES]?.tokenPrice || 0.50
    const totalCost = amount * tokenPrice

    // Here you would integrate with your payment processor (Stripe, etc.)
    // For now, we'll simulate a successful payment
    
    // Update user balance
    const newBalance = currentBalance + amount
    const { error: balanceError } = await supabase
      .from('user_balances')
      .upsert({
        user_id: userId,
        balance: newBalance,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (balanceError) {
      return new NextResponse(JSON.stringify({ error: 'Failed to update balance' }), { status: 500 })
    }

    // Record transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'purchase',
        amount: totalCost,
        description: `Token purchase: ${amount} tokens`,
        status: 'completed',
        created_at: new Date().toISOString()
      })

    if (transactionError) {
      console.error('Error recording transaction:', transactionError)
    }

    // Check if user should be warned about token limits
    if (shouldWarnAboutTokenLimit(currentTier, newBalance)) {
      try {
        const { data: user } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', userId)
          .single()
        
        if (user?.email) {
          const limit = SUBSCRIPTION_FEATURES[currentTier as keyof typeof SUBSCRIPTION_FEATURES]?.maxTokens || 0
          await sendTokenLimitWarning(
            user.email,
            user.full_name || 'User',
            currentTier,
            newBalance,
            limit
          )
          console.log(`Token limit warning email sent to ${user.email}`)
        }
      } catch (emailError) {
        console.error('Error sending token limit warning email:', emailError)
      }
    }

    return new NextResponse(JSON.stringify({
      success: true,
      newBalance,
      totalCost,
      limitInfo: getTokenLimitInfo(currentTier as any, newBalance)
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Error processing token purchase:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 