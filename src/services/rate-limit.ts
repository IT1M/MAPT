import { NextRequest } from 'next/server';

/**
 * Enhanced Rate Limiting Service
 * Supports per-IP and per-user rate limiting with configurable limits per endpoint
 */

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
  requests: number[];
}

/**
 * In-memory rate limiter
 * For production with multiple instances, use Redis
 */
class RateLimiter {
  private store = new Map<string, RateLimitRecord>();

  /**
   * Check if request is within rate limit
   */
  check(
    key: string,
    config: RateLimitConfig
  ): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
  } {
    const now = Date.now();
    const record = this.store.get(key);

    // Clean up old records
    if (record && now > record.resetAt) {
      this.store.delete(key);
    }

    const currentRecord = this.store.get(key);

    if (!currentRecord) {
      // First request in window
      this.store.set(key, {
        count: 1,
        resetAt: now + config.windowMs,
        requests: [now],
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: now + config.windowMs,
      };
    }

    // Filter requests within window
    const validRequests = currentRecord.requests.filter(
      (timestamp) => timestamp > now - config.windowMs
    );

    if (validRequests.length >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: currentRecord.resetAt,
      };
    }

    // Add current request
    validRequests.push(now);
    this.store.set(key, {
      count: validRequests.length,
      resetAt: currentRecord.resetAt,
      requests: validRequests,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - validRequests.length,
      resetAt: currentRecord.resetAt,
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all rate limit data
   */
  clearAll(): void {
    this.store.clear();
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Authentication endpoints
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many registration attempts. Please try again later.',
  },
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset requests. Please try again later.',
  },

  // API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many requests. Please slow down.',
  },
  apiStrict: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Rate limit exceeded. Please wait before trying again.',
  },

  // Export endpoints
  export: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many export requests. Please wait a minute.',
  },

  // Search endpoints
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'Too many search requests. Please slow down.',
  },

  // AI endpoints
  ai: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many AI requests. Please wait before trying again.',
  },

  // Email endpoints
  email: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many email requests. Please try again later.',
  },
};

/**
 * Get client identifier from request
 */
function getClientId(req: NextRequest, includeUser: boolean = false): string {
  // Try to get user ID from session
  const sessionToken =
    req.cookies.get('next-auth.session-token')?.value ||
    req.cookies.get('__Secure-next-auth.session-token')?.value;

  // Get IP address
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  if (includeUser && sessionToken) {
    return `user:${sessionToken}`;
  }

  return `ip:${ip}`;
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  req: NextRequest,
  configName: keyof typeof RATE_LIMIT_CONFIGS,
  options: {
    perUser?: boolean;
    customKey?: string;
  } = {}
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter: number;
} {
  const config = RATE_LIMIT_CONFIGS[configName];

  if (!config) {
    throw new Error(`Rate limit config not found: ${configName}`);
  }

  const key =
    options.customKey || `${configName}:${getClientId(req, options.perUser)}`;

  const result = rateLimiter.check(key, config);

  return {
    ...result,
    retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
  };
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(
  configName: keyof typeof RATE_LIMIT_CONFIGS,
  resetAt: number,
  retryAfter: number
): Response {
  const config = RATE_LIMIT_CONFIGS[configName];

  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: config.message || 'Too many requests. Please try again later.',
      },
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(resetAt),
      },
    }
  );
}

/**
 * Reset rate limit for a specific key
 */
export function resetRateLimit(key: string): void {
  rateLimiter.reset(key);
}

/**
 * Clear all rate limits (for testing)
 */
export function clearAllRateLimits(): void {
  rateLimiter.clearAll();
}
