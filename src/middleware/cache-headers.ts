/**
 * Cache Headers Middleware
 * 
 * Adds appropriate cache headers to API responses based on route patterns
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CACHE_CONTROL } from '@/utils/cache';

/**
 * Route-specific cache configurations
 */
const CACHE_CONFIG: Record<string, string> = {
  // Static data - cache for 1 hour
  '/api/products': CACHE_CONTROL.HOUR,
  '/api/settings': CACHE_CONTROL.MEDIUM,
  
  // Analytics - cache for 5 minutes
  '/api/analytics/summary': CACHE_CONTROL.MEDIUM,
  '/api/analytics/trends': CACHE_CONTROL.MEDIUM,
  '/api/dashboard': CACHE_CONTROL.MEDIUM,
  
  // Reports - cache for 15 minutes
  '/api/reports': CACHE_CONTROL.LONG,
  
  // Inventory - short cache (1 minute)
  '/api/inventory': CACHE_CONTROL.SHORT,
  
  // No cache for mutations and auth
  '/api/auth': CACHE_CONTROL.NO_CACHE,
  '/api/backup': CACHE_CONTROL.NO_CACHE,
  '/api/audit': CACHE_CONTROL.NO_CACHE,
};

/**
 * Determine cache control header based on request
 */
export function getCacheControlForRoute(pathname: string, method: string): string {
  // Never cache mutations
  if (method !== 'GET' && method !== 'HEAD') {
    return CACHE_CONTROL.NO_CACHE;
  }

  // Check exact match
  if (CACHE_CONFIG[pathname]) {
    return CACHE_CONFIG[pathname];
  }

  // Check prefix match
  for (const [route, cacheControl] of Object.entries(CACHE_CONFIG)) {
    if (pathname.startsWith(route)) {
      return cacheControl;
    }
  }

  // Default: short cache for GET requests
  return CACHE_CONTROL.SHORT;
}

/**
 * Add cache headers to response
 */
export function addCacheHeaders(
  response: NextResponse,
  cacheControl: string
): NextResponse {
  response.headers.set('Cache-Control', cacheControl);
  response.headers.set('CDN-Cache-Control', cacheControl);
  response.headers.set('Vercel-CDN-Cache-Control', cacheControl);
  
  // Add ETag for conditional requests
  if (cacheControl !== CACHE_CONTROL.NO_CACHE) {
    const etag = `"${Date.now()}"`;
    response.headers.set('ETag', etag);
  }
  
  return response;
}

/**
 * Middleware wrapper for API routes with caching
 */
export function withCacheHeaders(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const response = await handler(req);
    
    const cacheControl = getCacheControlForRoute(
      req.nextUrl.pathname,
      req.method
    );
    
    return addCacheHeaders(response, cacheControl);
  };
}
