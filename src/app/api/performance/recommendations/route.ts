/**
 * Performance Recommendations API
 * GET /api/performance/recommendations - Get AI-powered optimization recommendations
 * PATCH /api/performance/recommendations/[id] - Mark recommendation as implemented
 *
 * Requirements: 20.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { performanceOptimizerService } from '@/services/performance-optimizer';
import { logger } from '@/services/logger';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can access performance recommendations
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Clear cache if refresh requested
    if (forceRefresh) {
      performanceOptimizerService.clearCache();
    }

    // Analyze performance and get recommendations
    const analysis = await performanceOptimizerService.analyzePerformance();
    const progress = performanceOptimizerService.getImplementationProgress();

    logger.info('Performance recommendations retrieved', {
      userId: session.user.id,
      recommendationCount: analysis.recommendations.length,
      criticalIssues: analysis.criticalIssues.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        progress,
      },
    });
  } catch (error) {
    logger.error('Failed to get performance recommendations', error);
    return NextResponse.json(
      { error: 'Failed to retrieve performance recommendations' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can mark recommendations as implemented
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { recommendationId } = body;

    if (!recommendationId) {
      return NextResponse.json(
        { error: 'Recommendation ID is required' },
        { status: 400 }
      );
    }

    // Mark recommendation as implemented
    performanceOptimizerService.markAsImplemented(recommendationId);

    logger.info('Recommendation marked as implemented', {
      userId: session.user.id,
      recommendationId,
    });

    return NextResponse.json({
      success: true,
      message: 'Recommendation marked as implemented',
    });
  } catch (error) {
    logger.error('Failed to update recommendation', error);
    return NextResponse.json(
      { error: 'Failed to update recommendation' },
      { status: 500 }
    );
  }
}
