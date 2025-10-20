import { NextRequest } from 'next/server';
import { RateLimiter } from './rate-limiter';

/**
 * Specialized rate limiter for login attempts
 * Implements stricter limits to prevent brute force attacks
 */

/**
 * Login rate limiter - 5 attempts per 15 minutes per IP/email combination
 */
export const loginRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (req: NextRequest) => {
    // Use IP address as the primary key
    const ip =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown';
    return `login:${ip}`;
  },
});

/**
 * Per-email rate limiter - prevents targeting specific accounts
 * 10 attempts per 15 minutes per email address
 */
export const emailRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  keyGenerator: (req: NextRequest) => {
    // This will be set by the login handler after parsing the request body
    return 'email:unknown';
  },
});

/**
 * Check rate limit for login attempts
 * @param req - NextRequest object
 * @param email - Optional email address for per-email rate limiting
 * @returns Response if rate limit exceeded, null otherwise
 */
export function checkLoginRateLimit(
  req: NextRequest,
  email?: string
): Response | null {
  // Check IP-based rate limit
  const ip =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const ipKey = `login:${ip}`;

  if (!loginRateLimiter.check(ipKey)) {
    console.warn('[LoginRateLimit] IP rate limit exceeded:', {
      ip,
      path: req.nextUrl.pathname,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message:
            'Too many login attempts from this IP address. Please try again in 15 minutes.',
        },
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '900', // 15 minutes in seconds
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + 15 * 60 * 1000),
        },
      }
    );
  }

  // Check email-based rate limit if email is provided
  if (email) {
    const emailKey = `login:email:${email.toLowerCase()}`;

    if (!emailRateLimiter.check(emailKey)) {
      console.warn('[LoginRateLimit] Email rate limit exceeded:', {
        email,
        ip,
        timestamp: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message:
              'Too many login attempts for this account. Please try again in 15 minutes.',
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '900',
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Date.now() + 15 * 60 * 1000),
          },
        }
      );
    }
  }

  return null;
}

/**
 * Reset rate limits for a specific IP or email
 * Useful after successful login
 */
export function resetLoginRateLimit(ip: string, email?: string): void {
  const ipKey = `login:${ip}`;
  loginRateLimiter.reset(ipKey);

  if (email) {
    const emailKey = `login:email:${email.toLowerCase()}`;
    emailRateLimiter.reset(emailKey);
  }

  console.log('[LoginRateLimit] Rate limits reset for:', { ip, email });
}
