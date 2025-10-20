import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { prisma } from '@/services/prisma';
import { geminiService, InventoryData } from '@/services/gemini';
import { API_ERROR_CODES } from '@/utils/constants';

/**
 * GET /api/ai/insights
 * Generate AI-powered inventory insights
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

    // Check permissions - managers and admins can view insights
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

    // Fetch inventory data with product details
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        status: 'AVAILABLE', // Only analyze available items
      },
      include: {
        product: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 100, // Limit to most recent 100 items for performance
    });

    // Transform data to InventoryData format
    const inventoryData: InventoryData[] = inventoryItems.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      currentStock: item.quantity,
      minStockLevel: item.product.minStockLevel,
      maxStockLevel: item.product.maxStockLevel,
      reorderPoint: item.product.reorderPoint,
    }));

    // Aggregate by product (sum quantities for same product)
    const aggregatedData = inventoryData.reduce((acc, item) => {
      const existing = acc.find((i) => i.productId === item.productId);
      if (existing) {
        existing.currentStock += item.currentStock;
      } else {
        acc.push({ ...item });
      }
      return acc;
    }, [] as InventoryData[]);

    // Generate insights using Gemini AI
    const insights = await geminiService.generateInsights(aggregatedData);

    return NextResponse.json({
      success: true,
      data: insights,
    });
  } catch (error: any) {
    console.error('Error generating AI insights:', error);

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
          message: 'Failed to generate insights',
        },
      },
      { status: 500 }
    );
  }
}
