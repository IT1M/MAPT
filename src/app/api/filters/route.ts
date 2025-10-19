import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { prisma } from '@/services/prisma'
import { FilterGroup } from '@/types/filters'

/**
 * GET /api/filters
 * Get all saved filters for the current user and page
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page')

    const where: any = {
      userId: session.user.id,
    }

    if (page) {
      where.page = page
    }

    const filters = await prisma.savedFilter.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({
      success: true,
      filters: filters.map(f => ({
        ...f,
        filters: f.filters as FilterGroup,
      })),
    })
  } catch (error) {
    console.error('Error fetching saved filters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved filters' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/filters
 * Create a new saved filter
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, filters, page, isDefault } = body

    if (!name || !filters || !page) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults for this page
    if (isDefault) {
      await prisma.savedFilter.updateMany({
        where: {
          userId: session.user.id,
          page,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    const savedFilter = await prisma.savedFilter.create({
      data: {
        id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: session.user.id,
        name,
        filters: filters as any,
        page,
        isDefault: isDefault || false,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      filter: {
        ...savedFilter,
        filters: savedFilter.filters as FilterGroup,
      },
    })
  } catch (error) {
    console.error('Error creating saved filter:', error)
    return NextResponse.json(
      { error: 'Failed to create saved filter' },
      { status: 500 }
    )
  }
}
