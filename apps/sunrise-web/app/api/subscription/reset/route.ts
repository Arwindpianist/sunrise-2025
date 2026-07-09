import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

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

// Reset endpoint to set user back to free tier for testing
export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "User ID required" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Get current subscription
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

    // Get current balance
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
      beforeReset: {
        subscription: currentSubscription || null,
        balance: currentBalance
      },
      actions: []
    }

    // Reset subscription to free tier
    if (currentSubscription) {
      const { error: updateError } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
          tier: 'free',
          plan_id: 'free',
          status: 'active',
          stripe_subscription_id: null,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSubscription.id)

      if (updateError) {
        result.error = `Failed to reset subscription: ${updateError.message}`
      } else {
        result.actions.push('Reset subscription to free tier')
      }
    }

    // Reset balance to 15 tokens
    const { error: balanceUpdateError } = await supabaseAdmin
      .from('user_balances')
      .upsert({
        user_id: userId,
        balance: 15,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (balanceUpdateError) {
      result.error = `Failed to reset balance: ${balanceUpdateError.message}`
    } else {
      result.actions.push('Reset balance to 15 tokens')
    }

    // Get updated data
    const { data: updatedSubscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    const { data: updatedBalance } = await supabaseAdmin
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single()

    result.afterReset = {
      subscription: updatedSubscription || null,
      balance: updatedBalance?.balance || 0
    }

    result.success = !result.error

    return new NextResponse(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("Error in subscription reset:", error)
    return new NextResponse(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
} 