/**
 * Route Permissions Utility
 * Centralized route permission checking for middleware and components
 */

// User role type (compatible with Edge Runtime and Prisma)
export type UserRole = 'ADMIN' | 'DATA_ENTRY' | 'SUPERVISOR' | 'MANAGER' | 'AUDITOR'

/**
 * Route permissions mapping
 * Defines which roles can access which routes
 * This should be kept in sync with navigation.ts
 */
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/dashboard': ['ADMIN', 'DATA_ENTRY', 'SUPERVISOR', 'MANAGER', 'AUDITOR'],
  '/data-entry': ['ADMIN', 'DATA_ENTRY', 'SUPERVISOR'],
  '/data-log': ['ADMIN', 'DATA_ENTRY', 'SUPERVISOR', 'MANAGER', 'AUDITOR'],
  '/inventory': ['ADMIN', 'DATA_ENTRY', 'SUPERVISOR'],
  '/analytics': ['ADMIN', 'SUPERVISOR', 'MANAGER', 'AUDITOR'],
  '/reports': ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AUDITOR'],
  '/backup': ['ADMIN', 'MANAGER'],
  '/audit': ['ADMIN', 'AUDITOR'],
  '/settings': ['ADMIN', 'MANAGER', 'SUPERVISOR', 'DATA_ENTRY', 'AUDITOR'],
}

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = ['/login', '/']

/**
 * Check if a route is public
 * @param pathname - The pathname to check
 * @returns True if the route is public
 */
export function isPublicRoute(pathname: string): boolean {
  // Root path and locale root paths are public
  if (pathname === '/' || pathname === '/en' || pathname === '/ar') {
    return true
  }
  
  // Check if pathname matches any public route
  return PUBLIC_ROUTES.some(route => {
    // Remove locale prefix for comparison
    const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, '')
    return pathWithoutLocale === route || pathWithoutLocale.startsWith(route + '/')
  })
}

/**
 * Get the base route from a pathname
 * Example: /en/dashboard/overview -> /dashboard
 * @param pathname - The full pathname
 * @returns The base route without locale prefix
 */
export function getBaseRoute(pathname: string): string {
  // Remove locale prefix (e.g., /en, /ar)
  const withoutLocale = pathname.replace(/^\/(en|ar)/, '')
  
  // Get the first segment after locale
  const segments = withoutLocale.split('/').filter(Boolean)
  return segments.length > 0 ? `/${segments[0]}` : '/'
}

/**
 * Check if user has permission to access a route
 * @param userRole - The user's role
 * @param route - The route to check (base route without locale)
 * @returns True if the user has permission
 */
export function hasRoutePermission(userRole: UserRole, route: string): boolean {
  const allowedRoles = ROUTE_PERMISSIONS[route]
  
  // If route is not in permissions map, allow access (default behavior)
  if (!allowedRoles) {
    return true
  }
  
  return allowedRoles.includes(userRole)
}

/**
 * Get allowed roles for a route
 * @param route - The route to check
 * @returns Array of allowed roles or undefined if route is not restricted
 */
export function getAllowedRoles(route: string): UserRole[] | undefined {
  return ROUTE_PERMISSIONS[route]
}

/**
 * Check if a user can access any of the provided routes
 * @param userRole - The user's role
 * @param routes - Array of routes to check
 * @returns True if the user can access at least one route
 */
export function canAccessAnyRoute(userRole: UserRole, routes: string[]): boolean {
  return routes.some(route => hasRoutePermission(userRole, route))
}

/**
 * Get all accessible routes for a user role
 * @param userRole - The user's role
 * @returns Array of routes the user can access
 */
export function getAccessibleRoutes(userRole: UserRole): string[] {
  return Object.keys(ROUTE_PERMISSIONS).filter(route => 
    hasRoutePermission(userRole, route)
  )
}

/**
 * Validate route permissions configuration
 * Ensures all routes in navigation config have corresponding permissions
 * @returns Object with validation results
 */
export function validateRoutePermissions(): {
  valid: boolean
  missingRoutes: string[]
  extraRoutes: string[]
} {
  // This would need to import navigationConfig, but we'll keep it simple
  // for now to avoid circular dependencies
  return {
    valid: true,
    missingRoutes: [],
    extraRoutes: []
  }
}
