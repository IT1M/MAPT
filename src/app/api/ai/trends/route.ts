import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { prisma } from '@/services/prisma';
import { geminiService, InventoryData } from '@/services/gemini';
import { API_ERROR_CODES } from '@/utils/constants';

/**
 * GET /api/ai/trends
 * Analyze inventory trends using AI
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: API_ERROR_CODES.AUTH_REQUIRED,
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // Check permissions - managers and admins can view trends
    if (
      !session.user.permissions.includes('reports:view') &&
      !session.user.permissions.includes('inventory:read')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: API_ERROR_CODES.INSUFFICIENT_PERMISSIONS,
            message: 'Insufficient permissions',
          },
        },
        { status: 403 }
      );
    }

    // Check if Gemini service is available
    if (!geminiService.isAvailable()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: API_ERROR_CODES.EXTERNAL_SERVICE_ERROR,
            message: 'AI service is temporarily unavailable',
          },
        },
        { status: 503 }
      );
    }

    // Fetch inventory data with product details and recent transactions
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        status: 'AVAILABLE',
      },
      include: {
        product: true,
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Last 10 transactions per item
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 50, // Limit to 50 items for performance
    });

    // Transform data to InventoryData format with usage calculation
    const inventoryData: InventoryData[] = inventoryItems.map((item) => {
      // Calculate average usage from recent transactions
      const issueTransactions = item.transactions.filter(
        (t) => t.type === 'ISSUE'
      );
      const averageUsage =
        issueTransactions.length > 0
          ? issueTransactions.reduce((sum, t) => sum + t.quantity, 0) /
            issueTransactions.length
          : undefined;

      // Get last restock date
      const receiveTransactions = item.transactions.filter(
        (t) => t.type === 'RECEIVE'
      );
      const lastRestockDate =
        receiveTransactions.length > 0
          ? receiveTransactions[0].createdAt
          : undefined;

      return {
        productId: item.product.id,
        productName: item.product.name,
        currentStock: item.quantity,
        minStockLevel: item.product.minStockLevel,
        maxStockLevel: item.product.maxStockLevel,
        reorderPoint: item.product.reorderPoint,
        averageUsage,
        lastRestockDate,
      };
    });

    // Aggregate by product (sum quantities and average usage for same product)
    const aggregatedData = inventoryData.reduce((acc, item) => {
      const existing = acc.find((i) => i.productId === item.productId);
      if (existing) {
        existing.currentStock += item.currentStock;
        if (item.averageUsage && existing.averageUsage) {
          existing.averageUsage =
            (existing.averageUsage + item.averageUsage) / 2;
        } else if (item.averageUsage) {
          existing.averageUsage = item.averageUsage;
        }
        // Keep the most recent restock date
        if (item.lastRestockDate && existing.lastRestockDate) {
          existing.lastRestockDate =
            item.lastRestockDate > existing.lastRestockDate
              ? item.lastRestockDate
              : existing.lastRestockDate;
        } else if (item.lastRestockDate) {
          existing.lastRestockDate = item.lastRestockDate;
        }
      } else {
        acc.push({ ...item });
      }
      return acc;
    }, [] as InventoryData[]);

    // Analyze trends using Gemini AI
    const trends = await geminiService.analyzeInventoryTrends(aggregatedData);

    return NextResponse.json({
      success: true,
      data: trends,
    });
  } catch (error: any) {
    console.error('Error analyzing inventory trends:', error);

    // Handle specific error types
    if (error.message?.includes('Circuit breaker is OPEN')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: API_ERROR_CODES.EXTERNAL_SERVICE_ERROR,
            message:
              'AI service is temporarily unavailable due to repeated failures',
          },
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: API_ERROR_CODES.EXTERNAL_SERVICE_ERROR,
          message: 'Failed to analyze trends',
        },
      },
      { status: 500 }
    );
  }
}
