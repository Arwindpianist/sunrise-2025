import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { refererMatchesAllowedHosts } from '@repo/config'

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
    if (!refererMatchesAllowedHosts(referer)) {
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

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  // Check if user is disabled (deleted account)
  if ((token as any)?.deleted) {
    console.log(`[ACCOUNT DELETION] Blocked access for deleted user: ${token?.sub}`)

    // Redirect to home page with deletion message
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    redirectUrl.searchParams.set('message', 'account_deleted')
    return NextResponse.redirect(redirectUrl)
  }

  // If there's no session and the user is trying to access a protected route
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match dashboard routes and subscription API routes
    '/dashboard/:path*',
    '/api/subscription/:path*',
  ],
} 