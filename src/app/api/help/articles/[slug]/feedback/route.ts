import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { z } from 'zod';

// POST /api/help/articles/[slug]/feedback - Submit article feedback
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const feedbackSchema = z.object({
      helpful: z.boolean(),
    });

    const body = await request.json();
    const { helpful } = feedbackSchema.parse(body);

    // Check if article exists
    const article = await prisma.helpArticle.findUnique({
      where: { slug: params.slug },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Update feedback count
    const updated = await prisma.helpArticle.update({
      where: { slug: params.slug },
      data: helpful
        ? { helpful: { increment: 1 } }
        : { notHelpful: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      helpful: updated.helpful,
      notHelpful: updated.notHelpful,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
