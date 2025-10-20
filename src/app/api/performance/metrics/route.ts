/**
 * Performance Metrics API
 * GET /api/performance/metrics
 *
 * Returns real-time performance metrics including API response times,
 * error rates, and resource usage
 *
 * Requirements: 20.1, 20.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { performanceMetricsService } from '@/services/performance-metrics';
import { logger } from '@/services/logger';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can access performance metrics
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get time range from query params (default: last 60 minutes)
    const { searchParams } = new URL(request.url);
    const minutesAgo = parseInt(searchParams.get('minutes') || '60', 10);

    // Get performance stats
    const stats = performanceMetricsService.getPerformanceStats(minutesAgo);

    // Get active alerts
    const alerts = await performanceMetricsService.checkAlertRules();

    logger.info('Performance metrics retrieved', {
      userId: session.user.id,
      minutesAgo,
      totalRequests: stats.apiMetrics.totalRequests,
    });

    return NextResponse.json({
      success: true,
      data: {
        stats,
        alerts,
        timeRange: {
          minutes: minutesAgo,
          from: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
          to: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get performance metrics', error);
    return NextResponse.json(
      { error: 'Failed to retrieve performance metrics' },
      { status: 500 }
    );
  }
}
