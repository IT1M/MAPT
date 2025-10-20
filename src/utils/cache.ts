/**
 * Caching Utilities
 *
 * Provides caching strategies for API responses and data fetching
 */

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  HOUR: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;

// Cache control header values
export const CACHE_CONTROL = {
  NO_CACHE: 'no-cache, no-store, must-revalidate',
  SHORT: `public, max-age=${CACHE_TTL.SHORT}, s-maxage=${CACHE_TTL.SHORT}, stale-while-revalidate=${CACHE_TTL.SHORT * 2}`,
  MEDIUM: `public, max-age=${CACHE_TTL.MEDIUM}, s-maxage=${CACHE_TTL.MEDIUM}, stale-while-revalidate=${CACHE_TTL.MEDIUM * 2}`,
  LONG: `public, max-age=${CACHE_TTL.LONG}, s-maxage=${CACHE_TTL.LONG}, stale-while-revalidate=${CACHE_TTL.LONG * 2}`,
  HOUR: `public, max-age=${CACHE_TTL.HOUR}, s-maxage=${CACHE_TTL.HOUR}, stale-while-revalidate=${CACHE_TTL.HOUR * 2}`,
  DAY: `public, max-age=${CACHE_TTL.DAY}, s-maxage=${CACHE_TTL.DAY}, stale-while-revalidate=${CACHE_TTL.DAY * 2}`,
  IMMUTABLE: `public, max-age=${CACHE_TTL.DAY * 365}, immutable`,
} as const;

/**
 * Set cache headers on a Response object
 */
export function setCacheHeaders(
  response: Response,
  cacheControl: string
): Response {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', cacheControl);
  headers.set('CDN-Cache-Control', cacheControl);
  headers.set('Vercel-CDN-Cache-Control', cacheControl);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Create cache headers object for Next.js API routes
 */
export function getCacheHeaders(cacheControl: string): Record<string, string> {
  return {
    'Cache-Control': cacheControl,
    'CDN-Cache-Control': cacheControl,
    'Vercel-CDN-Cache-Control': cacheControl,
  };
}

/**
 * In-memory cache for API responses
 * Note: This is a simple implementation. For production, consider Redis or similar.
 */
class MemoryCache {
  private cache: Map<string, { data: any; expires: number }> = new Map();

  set(key: string, data: any, ttl: number): void {
    const expires = Date.now() + ttl * 1000;
    this.cache.set(key, { data, expires });
  }

  get<T = any>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const memoryCache = new MemoryCache();

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(
    () => {
      memoryCache.cleanup();
    },
    5 * 60 * 1000
  );
}

/**
 * Cache wrapper for async functions
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  // Check cache first
  const cached = memoryCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute function and cache result
  const result = await fn();
  memoryCache.set(key, result, ttl);
  return result;
}

/**
 * Generate cache key from request parameters
 */
export function generateCacheKey(
  prefix: string,
  params: Record<string, any>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return `${prefix}:${sortedParams}`;
}

/**
 * Invalidate cache by pattern
 */
export function invalidateCachePattern(pattern: string): void {
  const keys = Array.from(memoryCache['cache'].keys());
  keys.forEach((key) => {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  });
}

/**
 * Next.js revalidation helpers
 */
export const REVALIDATE = {
  NEVER: false,
  ALWAYS: 0,
  SHORT: CACHE_TTL.SHORT,
  MEDIUM: CACHE_TTL.MEDIUM,
  LONG: CACHE_TTL.LONG,
  HOUR: CACHE_TTL.HOUR,
  DAY: CACHE_TTL.DAY,
} as const;
