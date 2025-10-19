import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'
// Removed next-intl to simplify routing
// import createMiddleware from 'next-intl/middleware'
// import { locales, defaultLocale } from '@/i18n'
import type { UserRole } from '@/utils/route-permissions'
import {
  ROUTE_PERMISSIONS,
  isPublicRoute,
  getBaseRoute,
  hasRoutePermission,
} from '@/utils/route-permissions'

const { auth } = NextAuth(authConfig)

/**
 * Middleware function
 * Handles authentication and authorization for protected routes
 */
export default auth((req) => {
  const { pathname } = req.nextUrl
  
  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }
  
  // Check if user is authenticated
  const session = req.auth
  
  if (!session?.user) {
    // Redirect to login if not authenticated
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    loginUrl.searchParams.set('reason', 'session_required')
    return NextResponse.redirect(loginUrl)
  }
  
  // Check role-based permissions
  const baseRoute = getBaseRoute(pathname)
  const userRole = session.user.role
  
  if (!hasRoutePermission(userRole, baseRoute)) {
    // Redirect to access denied page with context
    const accessDeniedUrl = new URL('/access-denied', req.url)
    accessDeniedUrl.searchParams.set('path', pathname)
    accessDeniedUrl.searchParams.set('route', baseRoute)
    return NextResponse.redirect(accessDeniedUrl)
  }
  
  // Allow access
  return NextResponse.next()
})

/**
 * Middleware configuration
 * Specify which routes should be processed by this middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
