import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import { z } from 'zod'

// GET /api/help/articles - List articles with optional search and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      status: 'PUBLISHED'
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { tags: { has: query.toLowerCase() } }
      ]
    }

    if (category) {
      where.category = category
    }

    // Fetch articles with pagination
    const [articles, total] = await Promise.all([
      prisma.helpArticle.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { views: 'desc' },
          { helpful: 'desc' },
          { publishedAt: 'desc' }
        ],
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          tags: true,
          views: true,
          helpful: true,
          notHelpful: true,
          publishedAt: true,
          updatedAt: true
        }
      }),
      prisma.helpArticle.count({ where })
    ])

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching help articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch help articles' },
      { status: 500 }
    )
  }
}

// POST /api/help/articles - Create new article (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const articleSchema = z.object({
      title: z.string().min(3).max(200),
      slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/),
      category: z.string().min(2).max(50),
      content: z.string().min(10),
      tags: z.array(z.string()).optional(),
      status: z.enum(['DRAFT', 'PUBLISHED']).optional()
    })

    const body = await request.json()
    const data = articleSchema.parse(body)

    // Check if slug already exists
    const existing = await prisma.helpArticle.findUnique({
      where: { slug: data.slug }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Article with this slug already exists' },
        { status: 400 }
      )
    }

    const article = await prisma.helpArticle.create({
      data: {
        ...data,
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null
      }
    })

    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating help article:', error)
    return NextResponse.json(
      { error: 'Failed to create help article' },
      { status: 500 }
    )
  }
}
