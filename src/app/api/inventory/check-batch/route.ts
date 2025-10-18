import { NextRequest } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import {
  successResponse,
  authRequiredError,
  validationError,
  handleApiError,
} from '@/utils/api-response'

/**
 * GET /api/inventory/check-batch
 * Check if a batch number already exists in the database
 * 
 * Query parameters:
 * - batch: batch number to check (required)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return authRequiredError()
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const batch = searchParams.get('batch')

    // Validate required parameter
    if (!batch) {
      return validationError('Query parameter "batch" is required')
    }

    // Check if batch exists (excluding soft-deleted items)
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        batch: {
          equals: batch,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
      select: {
        id: true,
        itemName: true,
        createdAt: true,
        destination: true,
        quantity: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return successResponse({
      exists: !!existingItem,
      item: existingItem || undefined,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
