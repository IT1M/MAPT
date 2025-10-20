import { NextRequest } from 'next/server';
import { withRateLimit, defaultRateLimiter, RateLimiter } from './rate-limiter';
import { withErrorHandler } from '@/utils/error-handler';
import { addSecurityHeaders } from './security-headers';
import { withCsrfProtection } from './csrf';

/**
 * Configuration options for API route wrapper
 */
export interface ApiWrapperOptions {
  /**
   * Custom rate limiter instance (defaults to defaultRateLimiter)
   */
  rateLimiter?: RateLimiter;

  /**
   * Context string for error logging
   */
  errorContext?: string;

  /**
   * Whether to apply rate limiting (default: true)
   */
  enableRateLimit?: boolean;

  /**
   * Whether to add security headers (default: true)
   */
  enableSecurityHeaders?: boolean;

  /**
   * Whether to apply CSRF protection (default: true)
   */
  enableCsrfProtection?: boolean;
}

/**
 * Comprehensive API route wrapper that applies:
 * - Rate limiting
 * - Error handling
 * - Security headers
 *
 * @param handler - Route handler function
 * @param options - Configuration options
 * @returns Wrapped handler with all middleware applied
 *
 * @example
 * ```typescript
 * export const GET = withApiWrapper(async (request: NextRequest) => {
 *   // Your route logic here
 *   return successResponse({ data: 'Hello' })
 * }, { errorContext: 'GET /api/example' })
 * ```
 */
export function withApiWrapper(
  handler: (request: NextRequest, ...args: any[]) => Promise<Response>,
  options: ApiWrapperOptions = {}
): (request: NextRequest, ...args: any[]) => Promise<Response> {
  const {
    rateLimiter = defaultRateLimiter,
    errorContext,
    enableRateLimit = true,
    enableSecurityHeaders = true,
    enableCsrfProtection = true,
  } = options;

  // Start with the base handler
  let wrappedHandler = handler;

  // Apply error handling wrapper (innermost layer)
  wrappedHandler = withErrorHandler(wrappedHandler, errorContext);

  // Apply CSRF protection if enabled (before rate limiting to avoid wasting rate limit on invalid requests)
  if (enableCsrfProtection) {
    wrappedHandler = withCsrfProtection(wrappedHandler);
  }

  // Apply rate limiting if enabled
  if (enableRateLimit) {
    wrappedHandler = withRateLimit(wrappedHandler, rateLimiter);
  }

  // Apply security headers if enabled (outermost layer)
  if (enableSecurityHeaders) {
    const originalHandler = wrappedHandler;
    wrappedHandler = async (
      request: NextRequest,
      ...args: any[]
    ): Promise<Response> => {
      const response = await originalHandler(request, ...args);

      // Clone response to add security headers
      const headers = new Headers(response.headers);
      const securityHeaders = addSecurityHeaders({});

      Object.entries(securityHeaders).forEach(([key, value]) => {
        headers.set(key, value as string);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    };
  }

  return wrappedHandler;
}

/**
 * Wrapper for routes that don't need rate limiting (e.g., health checks)
 */
export function withApiWrapperNoRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<Response>,
  errorContext?: string
): (request: NextRequest, ...args: any[]) => Promise<Response> {
  return withApiWrapper(handler, {
    errorContext,
    enableRateLimit: false,
  });
}

/**
 * Wrapper for routes that don't need CSRF protection (e.g., webhooks, public APIs)
 */
export function withApiWrapperNoCsrf(
  handler: (request: NextRequest, ...args: any[]) => Promise<Response>,
  errorContext?: string
): (request: NextRequest, ...args: any[]) => Promise<Response> {
  return withApiWrapper(handler, {
    errorContext,
    enableCsrfProtection: false,
  });
}

/**
 * Wrapper for Gemini AI routes with custom rate limiter
 */
export function withGeminiApiWrapper(
  handler: (request: NextRequest, ...args: any[]) => Promise<Response>,
  errorContext?: string
): (request: NextRequest, ...args: any[]) => Promise<Response> {
  // Import geminiRateLimiter dynamically to avoid circular dependencies
  const { geminiRateLimiter } = require('./rate-limiter');

  return withApiWrapper(handler, {
    errorContext: errorContext || 'Gemini AI Route',
    rateLimiter: geminiRateLimiter,
  });
}
