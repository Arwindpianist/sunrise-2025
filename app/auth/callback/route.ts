import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/dashboard'
    const type = requestUrl.searchParams.get('type')

    if (code) {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth error:', error)
        return NextResponse.redirect(new URL('/login?error=auth&message=' + encodeURIComponent(error.message), requestUrl.origin))
      }

      // Check the type parameter to determine the flow
      if (type === 'recovery' || next === '/reset-password') {
        // This is a password reset - redirect to password reset page
        return NextResponse.redirect(new URL('/reset-password?success=email_verified', requestUrl.origin))
      }

      // Check if this was an email verification (default case)
      if (data.session?.user?.email_confirmed_at) {
        // Check if this user was referred and complete the referral
        try {
          // Use service role client for server-side operations
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

          const { data: referral } = await supabaseAdmin
            .from('referrals')
            .select('*')
            .eq('referred_email', data.session.user.email)
            .eq('status', 'pending')
            .single()

          if (referral) {
            // Update referral status to completed
            await supabaseAdmin
              .from('referrals')
              .update({
                status: 'completed',
                tokens_awarded: 10,
                completed_at: new Date().toISOString()
              })
              .eq('id', referral.id)

            // Award tokens to the referrer
            await supabaseAdmin
              .from('user_balances')
              .upsert({
                user_id: referral.referrer_id,
                balance: 10
              }, {
                onConflict: 'user_id',
                ignoreDuplicates: false
              })

            // Create a transaction record
            await supabaseAdmin
              .from('transactions')
              .insert({
                user_id: referral.referrer_id,
                type: 'referral_reward',
                amount: 10,
                description: `Referral reward for ${referral.referred_email}`,
                status: 'completed'
              })
          }
        } catch (error) {
          console.error('Error completing referral:', error)
          // Don't fail the auth flow for referral issues
        }

        return NextResponse.redirect(new URL('/login?success=email_verified', requestUrl.origin))
      }
    }

    // Default redirect to dashboard
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(new URL('/login?error=callback&message=' + encodeURIComponent('An unexpected error occurred'), new URL(request.url).origin))
  }
} 