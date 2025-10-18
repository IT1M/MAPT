import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import { inventoryItemSchema, inventoryUpdateSchema } from '@/utils/validators'
import { API_ERROR_CODES } from '@/utils/constants'
import { auditInventoryAction, extractRequestMetadata } from '@/utils/audit'
import { sanitizeString } from '@/utils/sanitize'
import {
  successResponse,
  authRequiredError,
  insufficientPermissionsError,
  validationError,
  notFoundError,
  handleApiError,
} from '@/utils/api-response'

/**
 * GET /api/inventory/[id]
 * Get a single inventory item by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: API_ERROR_CODES.AUTH_REQUIRED,
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    // Check permissions
    if (!session.user.permissions.includes('inventory:read')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: API_ERROR_CODES.INSUFFICIENT_PERMISSIONS,
            message: 'Insufficient permissions',
          },
        },
        { status: 403 }
      )
    }

    const { id } = params

    // Fetch inventory item with user details
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id },
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

    if (!inventoryItem) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: API_ERROR_CODES.NOT_FOUND,
            message: 'Inventory item not found',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: inventoryItem,
    })
  } catch (error) {
    console.error('Error fetching inventory item:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: API_ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to fetch inventory item',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/inventory/[id]
 * Partially update an inventory item with change tracking
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
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

    const { id } = params

    // Validate UUID parameter
    if (!id || id.length < 20) {
      return validationError('Invalid inventory item ID')
    }

    // Fetch existing item to capture old values
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id },
    })

    if (!existingItem) {
      return notFoundError('Inventory item not found')
    }

    // Check ownership for DATA_ENTRY users
    if (session.user.role === 'DATA_ENTRY' && existingItem.enteredById !== session.user.id) {
      return insufficientPermissionsError('You can only update items you created')
    }

    // Parse and validate partial update data
    const body = await request.json()
    const validationResult = inventoryUpdateSchema.safeParse(body)
    
    if (!validationResult.success) {
      return validationError('Validation failed', validationResult.error.errors)
    }

    const data = validationResult.data

    // Sanitize string inputs
    const updateData: any = {}
    if (data.itemName !== undefined) updateData.itemName = sanitizeString(data.itemName)
    if (data.batch !== undefined) updateData.batch = sanitizeString(data.batch)
    if (data.quantity !== undefined) updateData.quantity = data.quantity
    if (data.reject !== undefined) updateData.reject = data.reject
    if (data.destination !== undefined) updateData.destination = data.destination
    if (data.category !== undefined) updateData.category = sanitizeString(data.category)
    if (data.notes !== undefined) updateData.notes = sanitizeString(data.notes)

    // Update inventory item
    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
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

    // Create audit log with oldValue/newValue comparison
    const metadata = extractRequestMetadata(request)
    await auditInventoryAction(
      session.user.id,
      'UPDATE',
      updatedItem,
      existingItem,
      metadata
    )

    return successResponse(updatedItem, 'Inventory item updated successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/inventory/[id]
 * Delete an inventory item (soft or hard delete based on system settings)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return authRequiredError()
    }

    // Check user role (SUPERVISOR or higher)
    if (!['SUPERVISOR', 'MANAGER', 'ADMIN'].includes(session.user.role)) {
      return insufficientPermissionsError('Only SUPERVISOR or higher can delete inventory items')
    }

    const { id } = params

    // Validate UUID parameter
    if (!id || id.length < 20) {
      return validationError('Invalid inventory item ID')
    }

    // Check if inventory item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id },
    })

    if (!existingItem) {
      return notFoundError('Inventory item not found')
    }

    // Check if already soft deleted
    if (existingItem.deletedAt) {
      return validationError('Inventory item is already deleted')
    }

    // Fetch system setting for soft vs hard delete preference
    let useSoftDelete = true // Default to soft delete
    try {
      const setting = await prisma.systemSettings.findUnique({
        where: { key: 'inventory.useSoftDelete' },
      })
      if (setting && typeof setting.value === 'boolean') {
        useSoftDelete = setting.value as boolean
      }
    } catch (error) {
      // If setting doesn't exist, use default (soft delete)
      console.log('Using default soft delete setting')
    }

    if (useSoftDelete) {
      // Soft delete: set deletedAt timestamp
      await prisma.inventoryItem.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      })
    } else {
      // Hard delete: remove record
      await prisma.inventoryItem.delete({
        where: { id },
      })
    }

    // Create audit log with action=DELETE
    const metadata = extractRequestMetadata(request)
    await auditInventoryAction(
      session.user.id,
      'DELETE',
      existingItem,
      existingItem,
      metadata
    )

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
