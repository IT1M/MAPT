import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import { z } from 'zod'

// GET /api/help/articles/[slug] - Get single article by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const article = await prisma.helpArticle.findUnique({
      where: { slug: params.slug }
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Only show published articles to non-admin users
    const session = await auth()
    if (article.status !== 'PUBLISHED' && session?.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await prisma.helpArticle.update({
      where: { id: article.id },
      data: { views: { increment: 1 } }
    })

    // Get related articles (same category, exclude current)
    const relatedArticles = await prisma.helpArticle.findMany({
      where: {
        category: article.category,
        id: { not: article.id },
        status: 'PUBLISHED'
      },
      take: 3,
      orderBy: { views: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true
      }
    })

    return NextResponse.json({
      ...article,
      relatedArticles
    })
  } catch (error) {
    console.error('Error fetching help article:', error)
    return NextResponse.json(
      { error: 'Failed to fetch help article' },
      { status: 500 }
    )
  }
}

// PATCH /api/help/articles/[slug] - Update article (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const updateSchema = z.object({
      title: z.string().min(3).max(200).optional(),
      slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/).optional(),
      category: z.string().min(2).max(50).optional(),
      content: z.string().min(10).optional(),
      tags: z.array(z.string()).optional(),
      status: z.enum(['DRAFT', 'PUBLISHED']).optional()
    })

    const body = await request.json()
    const data = updateSchema.parse(body)

    // Check if article exists
    const existing = await prisma.helpArticle.findUnique({
      where: { slug: params.slug }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // If changing slug, check if new slug is available
    if (data.slug && data.slug !== params.slug) {
      const slugExists = await prisma.helpArticle.findUnique({
        where: { slug: data.slug }
      })

      if (slugExists) {
        return NextResponse.json(
          { error: 'Article with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Update publishedAt if status changes to PUBLISHED
    const updateData: any = {
      ...data,
      updatedAt: new Date()
    }

    if (data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date()
    }

    const article = await prisma.helpArticle.update({
      where: { slug: params.slug },
      data: updateData
    })

    return NextResponse.json(article)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating help article:', error)
    return NextResponse.json(
      { error: 'Failed to update help article' },
      { status: 500 }
    )
  }
}

// DELETE /api/help/articles/[slug] - Delete article (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await prisma.helpArticle.delete({
      where: { slug: params.slug }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting help article:', error)
    return NextResponse.json(
      { error: 'Failed to delete help article' },
      { status: 500 }
    )
  }
}
