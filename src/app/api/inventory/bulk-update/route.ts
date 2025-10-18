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
import { Destination } from '@prisma/client'

// Validation schema for bulk update request
const bulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID is required').max(100, 'Maximum 100 items can be updated at once'),
  updates: z.object({
    destination: z.nativeEnum(Destination).optional(),
    category: z.string().optional(),
    notes: z.string().optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  ),
})

/**
 * POST /api/inventory/bulk-update
 * Bulk update inventory items (destination, category, notes)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return authRequiredError()
    }

    // Check permissions
    if (!session.user.permissions.includes('inventory:write')) {
      return insufficientPermissionsError()
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = bulkUpdateSchema.safeParse(body)

    if (!validationResult.success) {
      return validationError('Validation failed', validationResult.error.errors)
    }

    const { ids, updates } = validationResult.data

    // Fetch items to be updated (for audit logging and validation)
    const itemsToUpdate = await prisma.inventoryItem.findMany({
      where: {
        id: { in: ids },
        deletedAt: null, // Only update items that aren't soft-deleted
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

    if (itemsToUpdate.length === 0) {
      return validationError('No valid items found to update')
    }

    // Role-based filtering: DATA_ENTRY users can only update their own items
    let itemsUserCanUpdate = itemsToUpdate
    if (session.user.role === 'DATA_ENTRY') {
      itemsUserCanUpdate = itemsToUpdate.filter(item => item.enteredById === session.user.id)
      
      if (itemsUserCanUpdate.length === 0) {
        return insufficientPermissionsError('You can only update items you created')
      }
      
      if (itemsUserCanUpdate.length < itemsToUpdate.length) {
        return insufficientPermissionsError(
          `You can only update ${itemsUserCanUpdate.length} of the ${itemsToUpdate.length} selected items (items you created)`
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (updates.destination !== undefined) {
      updateData.destination = updates.destination
    }
    if (updates.category !== undefined) {
      updateData.category = updates.category
    }
    if (updates.notes !== undefined) {
      updateData.notes = updates.notes
    }

    // Update items
    const updateResult = await prisma.inventoryItem.updateMany({
      where: {
        id: { in: itemsUserCanUpdate.map(item => item.id) },
        deletedAt: null,
      },
      data: updateData,
    })

    // Fetch updated items for audit logging
    const updatedItems = await prisma.inventoryItem.findMany({
      where: {
        id: { in: itemsUserCanUpdate.map(item => item.id) },
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

    // Create audit log entries for each updated item
    const metadata = extractRequestMetadata(request)
    const auditLogIds: string[] = []

    for (let i = 0; i < updatedItems.length; i++) {
      const updatedItem = updatedItems[i]
      const previousItem = itemsUserCanUpdate.find(item => item.id === updatedItem.id)
      
      if (previousItem) {
        const auditLog = await auditInventoryAction(
          session.user.id,
          'UPDATE',
          updatedItem,
          previousItem, // previousData
          metadata
        )
        if (auditLog) {
          auditLogIds.push(auditLog.id)
        }
      }
    }

    return successResponse(
      {
        updatedCount: updateResult.count,
        auditLogIds,
      },
      `Successfully updated ${updateResult.count} item(s)`,
      200
    )
  } catch (error) {
    return handleApiError(error)
  }
}
