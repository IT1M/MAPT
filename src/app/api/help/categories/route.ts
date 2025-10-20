import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';

// GET /api/help/categories - Get all categories with article counts
export async function GET(request: NextRequest) {
  try {
    // Get all published articles grouped by category
    const articles = await prisma.helpArticle.groupBy({
      by: ['category'],
      where: {
        status: 'PUBLISHED',
      },
      _count: {
        id: true,
      },
      orderBy: {
        category: 'asc',
      },
    });

    const categories = articles.map((item) => ({
      name: item.category,
      count: item._count.id,
    }));

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching help categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch help categories' },
      { status: 500 }
    );
  }
}
