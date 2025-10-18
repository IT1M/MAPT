import { NextRequest } from 'next/server'

/**
 * Rate limiter configuration
 */
export interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Max requests per window
  keyGenerator: (req: NextRequest) => string
}

/**
 * In-memory rate limiter for development
 * For production, consider using Redis
 */
export class RateLimiter {
  private requests: Map<string, number[]>
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.requests = new Map()
    this.config = config
  }

  /**
   * Check if request is within rate limit
   * @param key - Unique identifier for the client (e.g., user ID, IP)
   * @returns true if within limit, false if exceeded
   */
  check(key: string): boolean {
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    // Get existing requests for this key
    let timestamps = this.requests.get(key) || []

    // Filter out requests outside the current window
    timestamps = timestamps.filter(timestamp => timestamp > windowStart)

    // Check if limit exceeded
    if (timestamps.length >= this.config.maxRequests) {
      return false
    }

    // Add current request timestamp
    timestamps.push(now)
    this.requests.set(key, timestamps)

    return true
  }

  /**
   * Reset rate limit for a specific key
   * @param key - Unique identifier to reset
   */
  reset(key: string): void {
    this.requests.delete(key)
  }

  /**
   * Clear all rate limit data (useful for testing)
   */
  clearAll(): void {
    this.requests.clear()
  }

  /**
   * Get remaining requests for a key
   * @param key - Unique identifier
   * @returns number of remaining requests in current window
   */
  getRemaining(key: string): number {
    const now = Date.now()
    const windowStart = now - this.config.windowMs
    const timestamps = this.requests.get(key) || []
    const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart)
    return Math.max(0, this.config.maxRequests - validTimestamps.length)
  }
}

/**
 * Default rate limiter instance (100 requests per minute per user)
 */
export const defaultRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  keyGenerator: (req: NextRequest) => {
    // Use session ID or IP address as key
    const sessionId = req.cookies.get('next-auth.session-token')?.value
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    return sessionId || ip
  }
})

/**
 * Gemini API rate limiter (60 requests per minute globally)
 */
export const geminiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
  keyGenerator: () => 'gemini-global' // Global limit for all Gemini requests
})

/**
 * Rate limit middleware helper
 * @param limiter - RateLimiter instance to use
 * @returns Response if rate limit exceeded, null otherwise
 */
export function checkRateLimit(
  req: NextRequest,
  limiter: RateLimiter = defaultRateLimiter
): Response | null {
  const key = limiter['config'].keyGenerator(req)
  const allowed = limiter.check(key)

  if (!allowed) {
    // Log rate limit violation
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const path = req.nextUrl.pathname
    const method = req.method
    
    console.warn('[RateLimiter] Rate limit exceeded:', {
      key,
      ip,
      path,
      method,
      timestamp: new Date().toISOString(),
    })

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
        }
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          'X-RateLimit-Limit': String(limiter['config'].maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + limiter['config'].windowMs),
        }
      }
    )
  }

  // Add rate limit headers to successful requests
  const remaining = limiter.getRemaining(key)
  
  return null
}

/**
 * Wrapper to apply rate limiting to route handlers
 * @param handler - Route handler function
 * @param limiter - Optional custom rate limiter (defaults to defaultRateLimiter)
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<Response>,
  limiter: RateLimiter = defaultRateLimiter
): (request: NextRequest, ...args: any[]) => Promise<Response> {
  return async (request: NextRequest, ...args: any[]): Promise<Response> => {
    // Check rate limit
    const rateLimitResponse = checkRateLimit(request, limiter)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Add rate limit info to response headers
    const key = limiter['config'].keyGenerator(request)
    const remaining = limiter.getRemaining(key)
    
    const response = await handler(request, ...args)
    
    // Clone response to add headers
    const headers = new Headers(response.headers)
    headers.set('X-RateLimit-Limit', String(limiter['config'].maxRequests))
    headers.set('X-RateLimit-Remaining', String(remaining))
    headers.set('X-RateLimit-Reset', String(Date.now() + limiter['config'].windowMs))
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
}
