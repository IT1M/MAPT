import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from '@/i18n'
import type { UserRole } from '@/utils/route-permissions'
import {
  ROUTE_PERMISSIONS,
  isPublicRoute,
  getBaseRoute,
  hasRoutePermission,
} from '@/utils/route-permissions'

const { auth } = NextAuth(authConfig)

/**
 * Routes that should bypass internationalization middleware
 */
const INTL_BYPASS_ROUTES = ['/api/auth']

/**
 * Create next-intl middleware for locale handling
 */
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

/**
 * Middleware function
 * Handles internationalization, authentication and authorization for protected routes
 */
export default auth((req) => {
  const { pathname } = req.nextUrl
  
  // Bypass intl middleware for auth API routes
  if (INTL_BYPASS_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // First, handle internationalization
  // This will handle locale detection and persistence via cookies
  const intlResponse = intlMiddleware(req)
  
  // Allow public routes
  if (isPublicRoute(pathname)) {
    return intlResponse
  }
  
  // Check if user is authenticated
  const session = req.auth
  
  if (!session?.user) {
    // Redirect to login if not authenticated
    // Extract locale from pathname
    const localeMatch = pathname.match(/^\/(en|ar)/)
    const locale = localeMatch ? localeMatch[1] : defaultLocale
    
    const loginUrl = new URL(`/${locale}/login`, req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    loginUrl.searchParams.set('reason', 'session_required')
    return NextResponse.redirect(loginUrl)
  }
  
  // Check role-based permissions
  const baseRoute = getBaseRoute(pathname)
  const userRole = session.user.role
  
  if (!hasRoutePermission(userRole, baseRoute)) {
    // Redirect to access denied page with context
    // Extract locale from pathname
    const localeMatch = pathname.match(/^\/(en|ar)/)
    const locale = localeMatch ? localeMatch[1] : defaultLocale
    
    const accessDeniedUrl = new URL(`/${locale}/access-denied`, req.url)
    accessDeniedUrl.searchParams.set('path', pathname)
    accessDeniedUrl.searchParams.set('route', baseRoute)
    return NextResponse.redirect(accessDeniedUrl)
  }
  
  // Allow access with intl response (preserves locale cookies)
  return intlResponse
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
