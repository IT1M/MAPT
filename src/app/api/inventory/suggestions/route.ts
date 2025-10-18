import { NextRequest } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import {
  successResponse,
  authRequiredError,
  insufficientPermissionsError,
  validationError,
  handleApiError,
} from '@/utils/api-response'

/**
 * GET /api/inventory/suggestions
 * Get autocomplete suggestions for item names or categories
 * 
 * Query parameters:
 * - q: search query string (required)
 * - type: 'itemName' or 'category' (required)
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
    const query = searchParams.get('q')
    const type = searchParams.get('type')

    // Validate required parameters
    if (!query) {
      return validationError('Query parameter "q" is required')
    }

    if (!type || !['itemName', 'category'].includes(type)) {
      return validationError('Query parameter "type" must be "itemName" or "category"')
    }

    // Build where clause for search
    const where: any = {
      deletedAt: null, // Exclude soft-deleted items
    }

    // Add search condition based on type
    if (type === 'itemName') {
      where.itemName = {
        contains: query,
        mode: 'insensitive',
      }
    } else if (type === 'category') {
      where.category = {
        not: null,
        contains: query,
        mode: 'insensitive',
      }
    }

    // Get distinct values with frequency count
    const field = type === 'itemName' ? 'itemName' : 'category'
    
    const results = await prisma.inventoryItem.groupBy({
      by: [field],
      where,
      _count: {
        [field]: true,
      },
      orderBy: {
        _count: {
          [field]: 'desc',
        },
      },
      take: 10,
    })

    // Extract suggestions from results
    const suggestions = results
      .map((result) => result[field])
      .filter((value): value is string => value !== null && value !== undefined)

    return successResponse({ suggestions })
  } catch (error) {
    return handleApiError(error)
  }
}
