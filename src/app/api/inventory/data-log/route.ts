import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import { DEFAULT_PAGE_SIZE } from '@/utils/constants'
import {
  successResponse,
  authRequiredError,
  insufficientPermissionsError,
  handleApiError,
} from '@/utils/api-response'
import { Destination } from '@prisma/client'

/**
 * GET /api/inventory/data-log
 * Advanced data log viewer with filtering, sorting, pagination, and aggregates
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return authRequiredError()
    }

    // Check permissions
    if (!session.user.permissions.includes('inventory:read')) {
      return insufficientPermissionsError()
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(
      Math.max(1, parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE))),
      200
    )

    // Search parameter (searches across itemName and batch)
    const search = searchParams.get('search')?.trim() || undefined

    // Date range filters
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Destination filter (multi-select)
    const destinationsParam = searchParams.getAll('destination')
    const destinations = destinationsParam.length > 0 
      ? destinationsParam.filter(d => d === 'MAIS' || d === 'FOZAN') as Destination[]
      : undefined

    // Category filter (multi-select)
    const categoriesParam = searchParams.getAll('category')
    const categories = categoriesParam.length > 0 
      ? categoriesParam.filter(c => c.trim().length > 0)
      : undefined

    // Reject filter
    const rejectFilter = searchParams.get('rejectFilter') || 'all'

    // Entered by filter (multi-select, only for ADMIN/SUPERVISOR)
    const enteredByIdsParam = searchParams.getAll('enteredBy')
    const enteredByIds = enteredByIdsParam.length > 0 
      ? enteredByIdsParam.filter(id => id.trim().length > 0)
      : undefined

    // Sort parameters
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    // Build where clause
    const where: any = {
      deletedAt: null, // Exclude soft-deleted items
    }

    // Search filter (itemName OR batch)
    if (search) {
      where.OR = [
        {
          itemName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          batch: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    // Date range filters
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        try {
          where.createdAt.gte = new Date(startDate)
        } catch (e) {
          // Invalid date, skip filter
        }
      }
      if (endDate) {
        try {
          where.createdAt.lte = new Date(endDate)
        } catch (e) {
          // Invalid date, skip filter
        }
      }
    }

    // Destination filter
    if (destinations && destinations.length > 0) {
      where.destination = {
        in: destinations,
      }
    }

    // Category filter
    if (categories && categories.length > 0) {
      where.category = {
        in: categories,
      }
    }

    // Reject filter
    if (rejectFilter === 'none') {
      where.reject = 0
    } else if (rejectFilter === 'has') {
      where.reject = {
        gt: 0,
      }
    } else if (rejectFilter === 'high') {
      // High rejects (>10%)
      // We'll need to filter this in application logic since it requires calculation
      where.reject = {
        gt: 0,
      }
    }

    // Entered by filter (only for ADMIN/SUPERVISOR/AUDITOR)
    if (enteredByIds && enteredByIds.length > 0) {
      if (['ADMIN', 'SUPERVISOR', 'AUDITOR'].includes(session.user.role)) {
        where.enteredById = {
          in: enteredByIds,
        }
      }
    }

    // Role-based filtering: DATA_ENTRY users only see their own entries
    if (session.user.role === 'DATA_ENTRY') {
      where.enteredById = session.user.id
    }

    // Build orderBy clause
    const orderBy: any = {}
    
    // Map sortBy to actual field names
    const sortFieldMap: Record<string, string> = {
      'date': 'createdAt',
      'itemName': 'itemName',
      'quantity': 'quantity',
      'batch': 'batch',
      'createdAt': 'createdAt',
    }
    
    const actualSortField = sortFieldMap[sortBy] || 'createdAt'
    orderBy[actualSortField] = sortOrder

    // Get total count
    const total = await prisma.inventoryItem.count({ where })

    // Get paginated items with user details
    let items = await prisma.inventoryItem.findMany({
      where,
      include: {
        enteredBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // Post-process for high reject filter (>10%)
    if (rejectFilter === 'high') {
      items = items.filter(item => {
        const rejectPercentage = item.quantity > 0 ? (item.reject / item.quantity) * 100 : 0
        return rejectPercentage > 10
      })
    }

    // Calculate aggregates for all filtered data (not just current page)
    const allFilteredItems = await prisma.inventoryItem.findMany({
      where,
      select: {
        quantity: true,
        reject: true,
      },
    })

    // Post-process aggregates for high reject filter
    let aggregateItems = allFilteredItems
    if (rejectFilter === 'high') {
      aggregateItems = allFilteredItems.filter(item => {
        const rejectPercentage = item.quantity > 0 ? (item.reject / item.quantity) * 100 : 0
        return rejectPercentage > 10
      })
    }

    const totalQuantity = aggregateItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalRejects = aggregateItems.reduce((sum, item) => sum + item.reject, 0)
    const averageRejectRate = totalQuantity > 0 
      ? (totalRejects / totalQuantity) * 100 
      : 0

    // Add calculated rejectPercentage to each item
    const itemsWithPercentage = items.map(item => ({
      ...item,
      rejectPercentage: item.quantity > 0 ? (item.reject / item.quantity) * 100 : 0,
    }))

    const totalPages = Math.ceil(total / pageSize)

    return successResponse({
      items: itemsWithPercentage,
      pagination: {
        total,
        page,
        limit: pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      aggregates: {
        totalQuantity,
        totalRejects,
        averageRejectRate: Math.round(averageRejectRate * 100) / 100, // Round to 2 decimals
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
