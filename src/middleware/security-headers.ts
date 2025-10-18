/**
 * Security headers for API responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
} as const

/**
 * Add security headers to response
 * @param headers - Existing headers object
 * @returns Headers with security headers added
 */
export function addSecurityHeaders(headers: HeadersInit = {}): HeadersInit {
  return {
    ...headers,
    ...SECURITY_HEADERS,
  }
}

/**
 * Create response with security headers
 * @param body - Response body
 * @param init - Response init options
 * @returns Response with security headers
 */
export function createSecureResponse(
  body: BodyInit | null,
  init?: ResponseInit
): Response {
  const headers = addSecurityHeaders(init?.headers)
  
  return new Response(body, {
    ...init,
    headers,
  })
}
