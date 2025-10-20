import { NextRequest } from 'next/server';
import { prisma } from '@/services/prisma';
import { checkAuth } from '@/middleware/auth';
import {
  successResponse,
  handleApiError,
  insufficientPermissionsError,
} from '@/utils/api-response';

// In-memory cache for user activity
interface CacheEntry {
  data: any;
  timestamp: number;
}

const userActivityCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/analytics/user-activity
 *
 * Returns user activity heatmap data (day × hour) for analyzing usage patterns
 * This endpoint is restricted to ADMIN and SUPERVISOR roles only
 *
 * Query Parameters:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - destination: MAIS | FOZAN (optional)
 * - category: string (optional)
 * - userId: string (optional, ADMIN only)
 *
 * Returns:
 * - heatmap: Array of data points with dayOfWeek (0-6), hour (0-23), and count
 * - peakTimes: Array of top 5 peak activity periods
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

    // Restrict to ADMIN and SUPERVISOR only
    if (context.user.role !== 'ADMIN' && context.user.role !== 'SUPERVISOR') {
      return insufficientPermissionsError(
        'This endpoint is restricted to ADMIN and SUPERVISOR roles'
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const destination = searchParams.get('destination');
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');

    // Generate cache key
    const cacheKey = `user-activity:${context.user.role}:${startDate}:${endDate}:${destination}:${category}:${userId}`;

    // Check cache
    const cached = userActivityCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return successResponse(cached.data);
    }

    // Build where clause
    const whereClause: any = {
      deletedAt: null,
    };

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

    // Apply user filter (ADMIN only)
    if (userId && context.user.role === 'ADMIN') {
      whereClause.enteredById = userId;
    }

    // Fetch inventory items with timestamps
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: whereClause,
      select: {
        createdAt: true,
      },
    });

    // Build heatmap data structure (7 days × 24 hours)
    const heatmapData = new Map<string, number>();

    // Initialize all cells to 0
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        heatmapData.set(`${day}-${hour}`, 0);
      }
    }

    // Populate with actual data
    inventoryItems.forEach((item) => {
      const date = new Date(item.createdAt);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const hour = date.getHours(); // 0-23

      const key = `${dayOfWeek}-${hour}`;
      const count = heatmapData.get(key) || 0;
      heatmapData.set(key, count + 1);
    });

    // Convert to array format
    const heatmap = Array.from(heatmapData.entries()).map(([key, count]) => {
      const [dayOfWeek, hour] = key.split('-').map(Number);
      return {
        dayOfWeek,
        hour,
        count,
      };
    });

    // Find peak times (top 5 periods with highest activity)
    const peakTimes = heatmap
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => ({
        dayOfWeek: item.dayOfWeek,
        hour: item.hour,
        count: item.count,
      }));

    // Build response data
    const responseData = {
      heatmap,
      peakTimes,
    };

    // Cache the result
    userActivityCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
    });

    return successResponse(responseData);
  } catch (error) {
    return handleApiError(error);
  }
}
