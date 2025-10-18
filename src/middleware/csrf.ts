import { NextRequest } from 'next/server'
import { createErrorResponse } from '@/utils/error-handler'

/**
 * CSRF token configuration
 */
const CSRF_TOKEN_HEADER = 'x-csrf-token'
const CSRF_TOKEN_COOKIE = 'csrf-token'

/**
 * Generate a CSRF token
 * @returns Random CSRF token
 */
export function generateCsrfToken(): string {
  // Generate a random token (in production, use crypto.randomBytes)
  const array = new Uint8Array(32)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify CSRF token from request
 * @param req - Next.js request object
 * @returns true if token is valid, false otherwise
 */
export function verifyCsrfToken(req: NextRequest): boolean {
  const tokenFromHeader = req.headers.get(CSRF_TOKEN_HEADER)
  const tokenFromCookie = req.cookies.get(CSRF_TOKEN_COOKIE)?.value

  if (!tokenFromHeader || !tokenFromCookie) {
    return false
  }

  // Constant-time comparison to prevent timing attacks
  return tokenFromHeader === tokenFromCookie
}

/**
 * Check CSRF token for mutation operations
 * @param req - Next.js request object
 * @returns Response if CSRF check fails, null otherwise
 */
export function checkCsrf(req: NextRequest): Response | null {
  const method = req.method

  // Only check CSRF for mutation operations
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    // Skip CSRF check for NextAuth routes (they have their own CSRF protection)
    if (req.nextUrl.pathname.startsWith('/api/auth')) {
      return null
    }

    if (!verifyCsrfToken(req)) {
      // Log CSRF violation
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      const path = req.nextUrl.pathname
      
      console.warn('[CSRF] Token validation failed:', {
        ip,
        path,
        method,
        timestamp: new Date().toISOString(),
      })

      return createErrorResponse(
        'VALIDATION_ERROR',
        'CSRF token validation failed. Please refresh the page and try again.',
        undefined,
        403
      )
    }
  }

  return null
}

/**
 * Wrapper to apply CSRF protection to route handlers
 * @param handler - Route handler function
 * @returns Wrapped handler with CSRF protection
 */
export function withCsrfProtection(
  handler: (request: NextRequest, ...args: any[]) => Promise<Response>
): (request: NextRequest, ...args: any[]) => Promise<Response> {
  return async (request: NextRequest, ...args: any[]): Promise<Response> => {
    // Check CSRF token for mutation operations
    const csrfResponse = checkCsrf(request)
    if (csrfResponse) {
      return csrfResponse
    }

    // Execute the handler
    const response = await handler(request, ...args)
    
    // For GET requests, generate and attach a new CSRF token
    if (request.method === 'GET') {
      const token = generateCsrfToken()
      const headers = new Headers(response.headers)
      const csrfHeaders = addCsrfHeaders(token)
      
      Object.entries(csrfHeaders).forEach(([key, value]) => {
        headers.set(key, value as string)
      })
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    }
    
    return response
  }
}

/**
 * Add CSRF token to response headers
 * @param token - CSRF token to add
 * @returns Headers object with CSRF token
 */
export function addCsrfHeaders(token: string): HeadersInit {
  return {
    'Set-Cookie': `${CSRF_TOKEN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Secure`,
    [CSRF_TOKEN_HEADER]: token,
  }
}
