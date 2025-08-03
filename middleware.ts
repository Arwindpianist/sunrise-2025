import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Subscription security check
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/api/subscription/upgrade') || 
      pathname.startsWith('/api/subscription/downgrade') ||
      pathname.startsWith('/api/subscription/cancel')) {
    
    // Check if this is a legitimate request
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || ''
    
    // Block requests that don't come from our application
    if (!referer.includes('sunrise-2025.com') && !referer.includes('localhost')) {
      console.warn(`[SUBSCRIPTION SECURITY] Blocked unauthorized subscription change attempt from ${referer}`)
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized subscription change attempt' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Block requests without proper headers
    if (!userAgent.includes('Mozilla') && !userAgent.includes('Chrome') && !userAgent.includes('Safari')) {
      console.warn(`[SUBSCRIPTION SECURITY] Blocked subscription change with suspicious user agent: ${userAgent}`)
      return new NextResponse(
        JSON.stringify({ error: 'Invalid request' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  // Check if user is disabled (deleted account)
  if (session?.user?.user_metadata?.deleted) {
    console.log(`[ACCOUNT DELETION] Blocked access for deleted user: ${session.user.id}`)
    
    // Sign out the user
    await supabase.auth.signOut()
    
    // Redirect to home page with deletion message
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    redirectUrl.searchParams.set('message', 'account_deleted')
    return NextResponse.redirect(redirectUrl)
  }

  // If there's no session and the user is trying to access a protected route
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    // Match dashboard routes and subscription API routes
    '/dashboard/:path*',
    '/api/subscription/:path*',
  ],
} 