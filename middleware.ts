import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Maintenance configuration
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true'
const MAINTENANCE_ALLOWED_IPS = process.env.MAINTENANCE_ALLOWED_IPS?.split(',') || []
const MAINTENANCE_BYPASS_SECRET = process.env.MAINTENANCE_BYPASS_SECRET

export async function middleware(request: NextRequest) {
  // Check maintenance mode first
  if (MAINTENANCE_MODE) {
    // Allow access to maintenance page itself
    if (request.nextUrl.pathname === '/maintenance') {
      return NextResponse.next()
    }

    // Check for bypass secret in query parameter
    if (MAINTENANCE_BYPASS_SECRET && request.nextUrl.searchParams.get('bypass') === MAINTENANCE_BYPASS_SECRET) {
      return NextResponse.next()
    }

    // Check for allowed IPs
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    if (clientIP && MAINTENANCE_ALLOWED_IPS.includes(clientIP)) {
      return NextResponse.next()
    }

    // Redirect all requests to maintenance page
    const maintenanceUrl = new URL('/maintenance', request.url)
    
    // Preserve the original URL as a query parameter for redirect after maintenance
    if (request.nextUrl.pathname !== '/') {
      maintenanceUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search)
    }

    return NextResponse.redirect(maintenanceUrl)
  }

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

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
    // Match all routes for maintenance mode
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 