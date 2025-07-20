import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/dashboard'

    if (code) {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth error:', error)
        return NextResponse.redirect(new URL('/login?error=auth&message=' + encodeURIComponent(error.message), requestUrl.origin))
      }

      // Check if this was a password reset
      if (data.session?.user?.aud === 'authenticated' && data.session?.user?.app_metadata?.provider === 'email') {
        // This might be a password reset - redirect to password reset page
        return NextResponse.redirect(new URL('/reset-password?success=email_verified', requestUrl.origin))
      }

      // Check if this was an email verification
      if (data.session?.user?.email_confirmed_at) {
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