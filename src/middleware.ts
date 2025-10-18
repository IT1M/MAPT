import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from '@/i18n'

// User roles enum (duplicated here to avoid Prisma import in Edge Runtime)
enum UserRole {
  ADMIN = 'ADMIN',
  DATA_ENTRY = 'DATA_ENTRY',
  SUPERVISOR = 'SUPERVISOR',
  MANAGER = 'MANAGER',
  AUDITOR = 'AUDITOR',
}

const { auth } = NextAuth(authConfig)

/**
 * Route permissions mapping
 * Defines which roles can access which routes
 */
const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/dashboard': ['ADMIN', 'DATA_ENTRY', 'SUPERVISOR', 'MANAGER', 'AUDITOR'],
  '/inventory': ['ADMIN', 'DATA_ENTRY', 'SUPERVISOR'],
  '/data-entry': ['ADMIN', 'DATA_ENTRY', 'SUPERVISOR'],
  '/reports': ['ADMIN', 'MANAGER', 'AUDITOR'],
  '/settings': ['ADMIN'],
  '/audit': ['ADMIN', 'AUDITOR'],
}

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = ['/login', '/']

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
 * Check if a route is public
 */
function isPublicRoute(pathname: string): boolean {
  // Root path and locale root paths are public
  if (pathname === '/' || pathname === '/en' || pathname === '/ar') {
    return true
  }
  return PUBLIC_ROUTES.some(route => pathname.includes(route))
}

/**
 * Get the base route from a pathname
 * Example: /en/dashboard/overview -> /dashboard
 */
function getBaseRoute(pathname: string): string {
  // Remove locale prefix (e.g., /en, /ar)
  const withoutLocale = pathname.replace(/^\/(en|ar)/, '')
  
  // Get the first segment after locale
  const segments = withoutLocale.split('/').filter(Boolean)
  return segments.length > 0 ? `/${segments[0]}` : '/'
}

/**
 * Check if user has permission to access a route
 */
function hasRoutePermission(userRole: UserRole, route: string): boolean {
  const allowedRoles = ROUTE_PERMISSIONS[route]
  
  // If route is not in permissions map, allow access (default behavior)
  if (!allowedRoles) {
    return true
  }
  
  return allowedRoles.includes(userRole)
}

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
    return NextResponse.redirect(loginUrl)
  }
  
  // Check role-based permissions
  const baseRoute = getBaseRoute(pathname)
  const userRole = session.user.role
  
  if (!hasRoutePermission(userRole, baseRoute)) {
    // Return 403 Forbidden for insufficient permissions
    // Extract locale from pathname
    const localeMatch = pathname.match(/^\/(en|ar)/)
    const locale = localeMatch ? localeMatch[1] : defaultLocale
    
    const accessDeniedUrl = new URL(`/${locale}/access-denied`, req.url)
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
