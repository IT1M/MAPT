import { NextRequest } from 'next/server';
import { prisma } from '@/services/prisma';
import { checkAuth } from '@/middleware/auth';
import { successResponse, handleApiError } from '@/utils/api-response';

// In-memory cache for reject analysis
interface CacheEntry {
  data: any;
  timestamp: number;
}

const rejectAnalysisCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/analytics/reject-analysis
 *
 * Returns reject rate time series data for analyzing quality trends
 *
 * Query Parameters:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - destination: MAIS | FOZAN (optional)
 * - category: string (optional)
 * - userId: string (optional, ADMIN/SUPERVISOR only)
 * - groupBy: 'day' | 'week' | 'month' (default: 'day')
 *
 * Returns:
 * - timeSeries: Array of data points with accepted, rejected, and reject rate
 * - averageRejectRate: Overall average reject rate for the period
 * - trend: 'improving' | 'worsening' | 'stable'
 *
 * Implements 5-minute caching for performance
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth();
    if ('error' in authResult) {
      return authResult.error;
    }

    const { context } = authResult;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const destination = searchParams.get('destination');
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');
    const groupBy = (searchParams.get('groupBy') || 'day') as
      | 'day'
      | 'week'
      | 'month';

    // Generate cache key
    const cacheKey = `reject-analysis:${context.user.role}:${startDate}:${endDate}:${destination}:${category}:${userId}:${groupBy}`;

    // Check cache
    const cached = rejectAnalysisCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return successResponse(cached.data);
    }

    // Build where clause
    const whereClause: any = {
      deletedAt: null,
    };

    // Apply role-based filtering
    if (context.user.role === 'DATA_ENTRY') {
      whereClause.enteredById = context.user.id;
    }

    // Apply date range filter
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate);
      }
    }

    // Apply destination filter
    if (destination && (destination === 'MAIS' || destination === 'FOZAN')) {
      whereClause.destination = destination;
    }

    // Apply category filter
    if (category) {
      whereClause.category = category;
    }

    // Apply user filter (ADMIN/SUPERVISOR only)
    if (
      userId &&
      (context.user.role === 'ADMIN' || context.user.role === 'SUPERVISOR')
    ) {
      whereClause.enteredById = userId;
    }

    // Fetch inventory items
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: whereClause,
      select: {
        quantity: true,
        reject: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Helper function to format date based on groupBy
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      switch (groupBy) {
        case 'day':
          return `${year}-${month}-${day}`;
        case 'week':
          // Get ISO week number
          const weekDate = new Date(date);
          weekDate.setHours(0, 0, 0, 0);
          weekDate.setDate(weekDate.getDate() + 4 - (weekDate.getDay() || 7));
          const yearStart = new Date(weekDate.getFullYear(), 0, 1);
          const weekNo = Math.ceil(
            ((weekDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
          );
          return `${year}-W${String(weekNo).padStart(2, '0')}`;
        case 'month':
          return `${year}-${month}`;
      }
    };

    // Group data by time period
    const timeSeriesData = new Map<
      string,
      { accepted: number; rejected: number }
    >();

    inventoryItems.forEach((item) => {
      const dateKey = formatDate(item.createdAt);
      const existing = timeSeriesData.get(dateKey) || {
        accepted: 0,
        rejected: 0,
      };

      const acceptedQty = item.quantity - item.reject;
      timeSeriesData.set(dateKey, {
        accepted: existing.accepted + acceptedQty,
        rejected: existing.rejected + item.reject,
      });
    });

    // Convert to array and calculate reject rates
    const timeSeries = Array.from(timeSeriesData.entries())
      .map(([date, data]) => {
        const total = data.accepted + data.rejected;
        const rejectRate = total > 0 ? (data.rejected / total) * 100 : 0;
        return {
          date,
          accepted: data.accepted,
          rejected: data.rejected,
          rejectRate: Math.round(rejectRate * 100) / 100,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate average reject rate
    const totalAccepted = inventoryItems.reduce(
      (sum, item) => sum + (item.quantity - item.reject),
      0
    );
    const totalRejected = inventoryItems.reduce(
      (sum, item) => sum + item.reject,
      0
    );
    const totalQuantity = totalAccepted + totalRejected;
    const averageRejectRate =
      totalQuantity > 0
        ? Math.round((totalRejected / totalQuantity) * 100 * 100) / 100
        : 0;

    // Determine trend (compare first half vs second half)
    let trend: 'improving' | 'worsening' | 'stable' = 'stable';
    if (timeSeries.length >= 4) {
      const midpoint = Math.floor(timeSeries.length / 2);
      const firstHalf = timeSeries.slice(0, midpoint);
      const secondHalf = timeSeries.slice(midpoint);

      const firstHalfAvg =
        firstHalf.reduce((sum, item) => sum + item.rejectRate, 0) /
        firstHalf.length;
      const secondHalfAvg =
        secondHalf.reduce((sum, item) => sum + item.rejectRate, 0) /
        secondHalf.length;

      const difference = secondHalfAvg - firstHalfAvg;
      if (difference < -1) {
        trend = 'improving';
      } else if (difference > 1) {
        trend = 'worsening';
      }
    }

    // Build response data
    const responseData = {
      timeSeries,
      averageRejectRate,
      trend,
    };

    // Cache the result
    rejectAnalysisCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
    });

    return successResponse(responseData);
  } catch (error) {
    return handleApiError(error);
  }
}
