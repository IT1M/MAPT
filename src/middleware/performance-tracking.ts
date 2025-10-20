/**
 * Performance Tracking Middleware
 *
 * Automatically tracks API request performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { performanceMetricsService } from '@/services/performance-metrics';

export function performanceTrackingMiddleware(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const endpoint = req.nextUrl.pathname;
    const method = req.method;

    let response: NextResponse;
    let error: string | undefined;

    try {
      response = await handler(req);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      const status = response?.status || 500;

      // Record metric
      performanceMetricsService.recordAPIMetric({
        endpoint,
        method,
        duration,
        status,
        error,
      });
    }

    return response!;
  };
}

/**
 * Wrapper for API route handlers to automatically track performance
 */
export function withPerformanceTracking(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return performanceTrackingMiddleware(handler);
}
