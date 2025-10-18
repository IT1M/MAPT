/**
 * API Error Logging Middleware
 * 
 * Middleware for logging API errors with request context
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/services/logger';
import { getServerSession } from 'next-auth';

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Wrap API route handler with error logging
 */
export function withErrorLogging<T = any>(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse<T>> => {
    const requestId = generateRequestId();
    const startTime = Date.now();

    // Set request ID in logger
    logger.setRequestId(requestId);

    try {
      // Get user session if available
      const session = await getServerSession().catch(() => null);
      if (session?.user?.id) {
        logger.setUserId(session.user.id);
      }

      // Log incoming request
      logger.info('API Request', {
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(req.headers.entries()),
        userId: session?.user?.id,
      });

      // Execute handler
      const response = await handler(req, context);

      // Log successful response
      const duration = Date.now() - startTime;
      logger.info('API Response', {
        method: req.method,
        url: req.url,
        status: response.status,
        duration: `${duration}ms`,
      });

      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId);

      return response;
    } catch (error) {
      // Log error with full context
      const duration = Date.now() - startTime;
      logger.error('API Error', error, {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        requestId,
      });

      // Return error response
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
          requestId,
        },
        { 
          status: 500,
          headers: {
            'X-Request-ID': requestId,
          },
        }
      );
    } finally {
      // Clean up logger context
      logger.clearRequestId();
      logger.clearUserId();
    }
  };
}

/**
 * Log API error with context
 */
export function logApiError(
  error: Error | unknown,
  req: NextRequest,
  additionalContext?: Record<string, any>
): void {
  logger.error('API Error', error, {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    ...additionalContext,
  });
}

/**
 * Create error response with logging
 */
export function createErrorResponse(
  error: Error | unknown,
  req: NextRequest,
  status: number = 500,
  requestId?: string
): NextResponse {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorName = error instanceof Error ? error.name : 'Error';

  logApiError(error, req, {
    status,
    errorName,
    errorMessage,
  });

  return NextResponse.json(
    {
      error: errorName,
      message: errorMessage,
      ...(requestId && { requestId }),
    },
    { 
      status,
      headers: {
        ...(requestId && { 'X-Request-ID': requestId }),
      },
    }
  );
}

/**
 * Middleware to add request ID to all API requests
 */
export function requestIdMiddleware(req: NextRequest): string {
  const requestId = req.headers.get('X-Request-ID') || generateRequestId();
  logger.setRequestId(requestId);
  return requestId;
}
