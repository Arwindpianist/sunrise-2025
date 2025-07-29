import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

// Create a Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export const dynamic = "force-dynamic"

// Test endpoint to simulate webhook functionality
export async function POST(request: Request) {
  try {
    const { userId, testType } = await request.json()

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "User ID required" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Get user's current subscription
    const { data: currentSubscription, error: subscriptionError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      return new NextResponse(
        JSON.stringify({ error: `Error fetching subscription: ${subscriptionError.message}` }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Get user's current balance
    const { data: balanceData, error: balanceError } = await supabaseAdmin
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (balanceError && balanceError.code !== 'PGRST116') {
      return new NextResponse(
        JSON.stringify({ error: `Error fetching balance: ${balanceError.message}` }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const currentBalance = balanceData?.balance || 0

    let result: any = {
      userId,
      currentSubscription: currentSubscription || null,
      currentBalance,
      testType,
      actions: []
    }

    // Test different scenarios based on testType
    switch (testType) {
      case 'credit_tokens':
        // Test token crediting functionality
        const tokensToCredit = 10
        const newBalance = currentBalance + tokensToCredit
        
        // Use upsert with onConflict to handle unique constraint
        const { error: updateError } = await supabaseAdmin
          .from('user_balances')
          .upsert({
            user_id: userId,
            balance: newBalance,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })

        if (updateError) {
          result.error = `Failed to update balance: ${updateError.message}`
        } else {
          result.actions.push(`Credited ${tokensToCredit} tokens`)
          result.newBalance = newBalance
          result.success = true
        }
        break

      case 'test_token_purchase':
        // Test token purchase functionality
        const purchaseAmount = 25
        const purchaseTokens = 50
        const newBalanceAfterPurchase = currentBalance + purchaseTokens
        
        // Update balance
        const { error: purchaseBalanceError } = await supabaseAdmin
          .from('user_balances')
          .upsert({
            user_id: userId,
            balance: newBalanceAfterPurchase,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })

        if (purchaseBalanceError) {
          result.error = `Failed to update balance after purchase: ${purchaseBalanceError.message}`
        } else {
          // Create transaction record
          const { error: transactionError } = await supabaseAdmin
            .from('transactions')
            .insert({
              user_id: userId,
              type: 'purchase',
              amount: purchaseAmount,
              description: `Test token purchase: ${purchaseTokens} tokens`,
              status: 'completed',
              created_at: new Date().toISOString()
            })

          if (transactionError) {
            result.error = `Failed to create transaction: ${transactionError.message}`
          } else {
            result.actions.push(`Purchased ${purchaseTokens} tokens for $${purchaseAmount}`)
            result.newBalance = newBalanceAfterPurchase
            result.success = true
          }
        }
        break

      case 'test_token_limit':
        // Test token limit enforcement
        const currentTier = currentSubscription?.tier || 'free'
        const tierLimits = {
          free: 15,
          basic: 100,
          pro: -1, // Unlimited
          enterprise: -1 // Unlimited
        }
        const currentLimit = tierLimits[currentTier as keyof typeof tierLimits] || 0
        
        result.actions.push(`Testing token limit for ${currentTier} tier (limit: ${currentLimit === -1 ? 'Unlimited' : currentLimit})`)
        result.actions.push(`Current balance: ${currentBalance} tokens`)
        
        // Check if unlimited tier
        if (currentLimit === -1) {
          result.actions.push(`✅ Unlimited tier - no token limits apply`)
          result.limitTest = {
            currentTier,
            currentBalance,
            currentLimit: 'Unlimited',
            isUnlimited: true
          }
        } else {
          // Check current status for limited tiers
          if (currentBalance >= currentLimit) {
            result.actions.push(`❌ Already at or over limit! Current balance (${currentBalance}) >= Limit (${currentLimit})`)
            result.limitTest = {
              currentTier,
              currentBalance,
              currentLimit,
              isOverLimit: true,
              overBy: currentBalance - currentLimit
            }
          } else {
            // Try to purchase tokens that would exceed the limit
            const remainingSpace = currentLimit - currentBalance
            const overLimitTokens = remainingSpace + 50
            
            result.actions.push(`Remaining space: ${remainingSpace} tokens`)
            result.actions.push(`Attempting to purchase ${overLimitTokens} tokens (would exceed by ${overLimitTokens - remainingSpace} tokens)`)
            
            // Check if this would exceed the limit
            const wouldExceed = (currentBalance + overLimitTokens) > currentLimit
            
            if (wouldExceed) {
              result.actions.push(`❌ Would exceed limit by ${(currentBalance + overLimitTokens) - currentLimit} tokens`)
              result.limitTest = {
                currentTier,
                currentBalance,
                currentLimit,
                attemptedPurchase: overLimitTokens,
                wouldExceed: true,
                overBy: (currentBalance + overLimitTokens) - currentLimit
              }
            } else {
              result.actions.push(`✅ Purchase would be within limits`)
              result.limitTest = {
                currentTier,
                currentBalance,
                currentLimit,
                attemptedPurchase: overLimitTokens,
                wouldExceed: false
              }
            }
          }
        }
        
        result.success = true
        break

      case 'update_subscription':
        // Test subscription update functionality
        if (currentSubscription) {
          const { error: updateError } = await supabaseAdmin
            .from('user_subscriptions')
            .update({
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', currentSubscription.id)

          if (updateError) {
            result.error = `Failed to update subscription: ${updateError.message}`
          } else {
            result.actions.push('Updated subscription status to active')
            result.success = true
          }
        } else {
          result.error = 'No subscription found to update'
        }
        break

      case 'create_subscription':
        // Test creating/updating a subscription
        const subscriptionData = {
          user_id: userId,
          tier: 'basic',
          plan_id: 'basic', // Add the required plan_id field
          status: 'active',
          stripe_subscription_id: 'test_sub_' + Date.now(),
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          updated_at: new Date().toISOString()
        }

        let newSubscription;
        let createError;

        if (currentSubscription) {
          // Update existing subscription
          const { data: updatedSubscription, error: updateError } = await supabaseAdmin
            .from('user_subscriptions')
            .update(subscriptionData)
            .eq('id', currentSubscription.id)
            .select()
            .single()

          newSubscription = updatedSubscription;
          createError = updateError;
          result.actions.push('Updated existing subscription to basic')
        } else {
          // Create new subscription
          const { data: createdSubscription, error: insertError } = await supabaseAdmin
            .from('user_subscriptions')
            .insert({
              ...subscriptionData,
              created_at: new Date().toISOString()
            })
            .select()
            .single()

          newSubscription = createdSubscription;
          createError = insertError;
          result.actions.push('Created new test subscription')
        }

        if (createError) {
          result.error = `Failed to create/update subscription: ${createError.message}`
        } else {
          result.newSubscription = newSubscription
          result.success = true
        }
        break

      case 'full_test':
        // Test the complete flow: create/update subscription + credit tokens
        const fullSubscriptionData = {
          user_id: userId,
          tier: 'basic',
          plan_id: 'basic', // Add the required plan_id field
          status: 'active',
          stripe_subscription_id: 'test_sub_full_' + Date.now(),
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }

        let fullSubscription;
        let fullCreateError;

        if (currentSubscription) {
          // Update existing subscription
          const { data: updatedSubscription, error: updateError } = await supabaseAdmin
            .from('user_subscriptions')
            .update(fullSubscriptionData)
            .eq('id', currentSubscription.id)
            .select()
            .single()

          fullSubscription = updatedSubscription;
          fullCreateError = updateError;
          result.actions.push('Updated existing subscription to basic')
        } else {
          // Create new subscription
          const { data: createdSubscription, error: insertError } = await supabaseAdmin
            .from('user_subscriptions')
            .insert({
              ...fullSubscriptionData,
              created_at: new Date().toISOString()
            })
            .select()
            .single()

          fullSubscription = createdSubscription;
          fullCreateError = insertError;
          result.actions.push('Created new test subscription')
        }

        if (fullCreateError) {
          result.error = `Failed to create/update subscription: ${fullCreateError.message}`
          break
        }

        // Credit tokens
        const fullNewBalance = currentBalance + 10
        const { error: fullBalanceError } = await supabaseAdmin
          .from('user_balances')
          .upsert({
            user_id: userId,
            balance: fullNewBalance,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })

        if (fullBalanceError) {
          result.error = `Failed to credit tokens: ${fullBalanceError.message}`
        } else {
          result.actions.push('Credited 10 tokens')
          result.newBalance = fullNewBalance
          result.newSubscription = fullSubscription
          result.success = true
        }
        break

      default:
        result.error = `Unknown test type: ${testType}. Available types: credit_tokens, update_subscription, create_subscription, full_test`
    }

    return new NextResponse(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("Error in webhook test:", error)
    return new NextResponse(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
} 