/**
 * Endpoint Performance API
 * GET /api/performance/endpoint
 *
 * Returns performance metrics for a specific endpoint
 *
 * Requirements: 20.1
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

    // Only admins can access endpoint metrics
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const minutesAgo = parseInt(searchParams.get('minutes') || '60', 10);

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint parameter is required' },
        { status: 400 }
      );
    }

    // Get endpoint metrics
    const metrics = performanceMetricsService.getEndpointMetrics(
      endpoint,
      minutesAgo
    );

    logger.info('Endpoint metrics retrieved', {
      userId: session.user.id,
      endpoint,
      minutesAgo,
    });

    return NextResponse.json({
      success: true,
      data: {
        endpoint,
        metrics,
        timeRange: {
          minutes: minutesAgo,
          from: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
          to: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get endpoint metrics', error);
    return NextResponse.json(
      { error: 'Failed to retrieve endpoint metrics' },
      { status: 500 }
    );
  }
}
