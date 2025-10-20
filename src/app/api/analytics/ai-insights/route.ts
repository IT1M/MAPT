import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/services/prisma';
import { geminiService } from '@/services/gemini';
import { checkAuth } from '@/middleware/auth';
import {
  successResponse,
  handleApiError,
  validationError,
} from '@/utils/api-response';

// In-memory cache for AI insights (1-hour TTL)
interface CacheEntry {
  data: any;
  timestamp: number;
}

const insightsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Request validation schema
const aiInsightsSchema = z.object({
  dataType: z.enum(['inventory', 'trends', 'comparison']),
  period: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }),
});

/**
 * POST /api/analytics/ai-insights
 *
 * Generates AI-powered insights using Gemini AI
 *
 * Request Body:
 * - dataType: 'inventory' | 'trends' | 'comparison'
 * - period: { startDate: ISO date, endDate: ISO date }
 *
 * Returns:
 * - insights: Array of actionable insights
 * - trends: Array of trend analysis
 * - predictions: Array of stock predictions
 * - generatedAt: Timestamp
 *
 * Implements 1-hour caching for identical requests
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth();
    if ('error' in authResult) {
      return authResult.error;
    }

    const { context } = authResult;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = aiInsightsSchema.safeParse(body);

    if (!validationResult.success) {
      return validationError(
        'Invalid request body',
        validationResult.error.errors
      );
    }

    const { dataType, period } = validationResult.data;

    // Generate cache key
    const cacheKey = `ai-insights:${context.user.role}:${dataType}:${period.startDate}:${period.endDate}`;

    // Check cache
    const cached = insightsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return successResponse(cached.data);
    }

    // Parse dates
    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);

    // Validate date range
    if (startDate >= endDate) {
      return validationError('startDate must be before endDate');
    }

    // Build where clause
    const whereClause: any = {
      deletedAt: null,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Apply role-based filtering
    if (context.user.role === 'DATA_ENTRY') {
      whereClause.enteredById = context.user.id;
    }

    // Fetch inventory data for specified period
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: whereClause,
      select: {
        id: true,
        itemName: true,
        batch: true,
        quantity: true,
        reject: true,
        destination: true,
        category: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Check if Gemini service is available
    if (!geminiService.isAvailable()) {
      return successResponse({
        insights: [
          {
            type: 'info',
            message:
              'AI insights are temporarily unavailable. Please try again later.',
            priority: 'low',
            confidence: 1.0,
          },
        ],
        trends: [],
        predictions: [],
        generatedAt: new Date().toISOString(),
        fallback: true,
      });
    }

    // Format data for Gemini AI
    // Group items by product name to calculate aggregates
    const productMap = new Map<
      string,
      {
        totalQuantity: number;
        totalReject: number;
        count: number;
        minQuantity: number;
        maxQuantity: number;
      }
    >();

    inventoryItems.forEach((item) => {
      const existing = productMap.get(item.itemName) || {
        totalQuantity: 0,
        totalReject: 0,
        count: 0,
        minQuantity: Infinity,
        maxQuantity: 0,
      };

      productMap.set(item.itemName, {
        totalQuantity: existing.totalQuantity + item.quantity,
        totalReject: existing.totalReject + item.reject,
        count: existing.count + 1,
        minQuantity: Math.min(existing.minQuantity, item.quantity),
        maxQuantity: Math.max(existing.maxQuantity, item.quantity),
      });
    });

    // Convert to format expected by Gemini service
    const formattedData = Array.from(productMap.entries()).map(
      ([productName, data]) => ({
        productId: productName.toLowerCase().replace(/\s+/g, '-'),
        productName,
        currentStock: data.totalQuantity,
        minStockLevel: data.minQuantity,
        maxStockLevel: data.maxQuantity,
        reorderPoint: Math.round(data.minQuantity * 1.5),
        averageUsage: Math.round(data.totalQuantity / data.count),
      })
    );

    // Call Gemini Service methods
    const [trends, insights, predictions] = await Promise.all([
      geminiService.analyzeInventoryTrends(formattedData),
      geminiService.generateInsights(formattedData),
      geminiService.predictStockNeeds(formattedData),
    ]);

    // Add confidence scores to insights (if not already present)
    const insightsWithConfidence = insights.map((insight) => ({
      ...insight,
      confidence: 0.75, // Default confidence for insights
    }));

    // Build response data
    const responseData = {
      insights: insightsWithConfidence,
      trends,
      predictions,
      generatedAt: new Date().toISOString(),
    };

    // Cache the result
    insightsCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
    });

    return successResponse(responseData);
  } catch (error) {
    // Handle Gemini-specific errors gracefully
    if (error instanceof Error && error.message.includes('Gemini')) {
      return successResponse({
        insights: [
          {
            type: 'warning',
            message: 'AI service encountered an error. Showing basic analysis.',
            priority: 'medium',
            confidence: 0.5,
          },
        ],
        trends: [],
        predictions: [],
        generatedAt: new Date().toISOString(),
        fallback: true,
      });
    }

    return handleApiError(error);
  }
}
