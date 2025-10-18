import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import { auditInventoryAction, extractRequestMetadata } from '@/utils/audit'
import {
  successResponse,
  authRequiredError,
  insufficientPermissionsError,
  validationError,
  handleApiError,
} from '@/utils/api-response'
import { z } from 'zod'

// Validation schema for bulk delete request
const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID is required').max(100, 'Maximum 100 items can be deleted at once'),
})

/**
 * POST /api/inventory/bulk-delete
 * Bulk delete inventory items (SUPERVISOR/ADMIN only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return authRequiredError()
    }

    // Check role-based access: Only SUPERVISOR or ADMIN can bulk delete
    if (session.user.role !== 'SUPERVISOR' && session.user.role !== 'ADMIN') {
      return insufficientPermissionsError('Only supervisors and administrators can delete inventory items')
    }

    // Check permissions
    if (!session.user.permissions.includes('inventory:delete')) {
      return insufficientPermissionsError()
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = bulkDeleteSchema.safeParse(body)

    if (!validationResult.success) {
      return validationError('Validation failed', validationResult.error.errors)
    }

    const { ids } = validationResult.data

    // Fetch items to be deleted (for audit logging)
    const itemsToDelete = await prisma.inventoryItem.findMany({
      where: {
        id: { in: ids },
        deletedAt: null, // Only delete items that aren't already soft-deleted
      },
      include: {
        enteredBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (itemsToDelete.length === 0) {
      return validationError('No valid items found to delete')
    }

    // Soft delete items (set deletedAt timestamp)
    const deleteResult = await prisma.inventoryItem.updateMany({
      where: {
        id: { in: itemsToDelete.map(item => item.id) },
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    })

    // Create audit log entries for each deleted item
    const metadata = extractRequestMetadata(request)
    const auditLogIds: string[] = []

    for (const item of itemsToDelete) {
      const auditLog = await auditInventoryAction(
        session.user.id,
        'DELETE',
        item,
        item, // previousData is the item itself for DELETE
        metadata
      )
      if (auditLog) {
        auditLogIds.push(auditLog.id)
      }
    }

    return successResponse(
      {
        deletedCount: deleteResult.count,
        auditLogIds,
      },
      `Successfully deleted ${deleteResult.count} item(s)`,
      200
    )
  } catch (error) {
    return handleApiError(error)
  }
}
