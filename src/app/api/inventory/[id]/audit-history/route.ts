import { NextRequest } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import {
  successResponse,
  authRequiredError,
  insufficientPermissionsError,
  notFoundError,
  validationError,
  handleApiError,
} from '@/utils/api-response'
import { calculatePagination, calculateSkip, normalizePagination } from '@/utils/pagination'

/**
 * GET /api/inventory/[id]/audit-history
 * Get audit history for a specific inventory item with pagination
 * Includes user information and formatted field-level changes
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
      return authRequiredError()
    }

    // Check permissions - user must have inventory:read permission
    if (!session.user.permissions.includes('inventory:read')) {
      return insufficientPermissionsError()
    }

    const { id } = params

    // Validate inventory item ID
    if (!id || id.length < 20) {
      return validationError('Invalid inventory item ID')
    }

    // Check if inventory item exists
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!inventoryItem) {
      return notFoundError('Inventory item not found')
    }

    // Parse pagination parameters
    const searchParams = request.nextUrl.searchParams
    const rawPage = parseInt(searchParams.get('page') || '1')
    const rawLimit = parseInt(searchParams.get('limit') || '20')
    const { page, limit } = normalizePagination(rawPage, rawLimit, 100)

    // Build where clause for audit logs
    const where = {
      entityType: 'InventoryItem',
      entityId: id,
    }

    // Get total count of audit entries
    const total = await prisma.auditLog.count({ where })

    // Fetch audit log entries with user information
    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      skip: calculateSkip(page, limit),
      take: limit,
    })

    // Format audit entries with field-level changes
    const formattedEntries = auditLogs.map((log) => {
      const changes = formatFieldChanges(log.oldValue, log.newValue)
      
      return {
        id: log.id,
        timestamp: log.timestamp,
        action: log.action,
        user: {
          id: log.user.id,
          name: log.user.name,
          email: log.user.email,
          role: log.user.role,
        },
        changes,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      }
    })

    // Calculate pagination metadata
    const pagination = calculatePagination(total, page, limit)

    return successResponse({
      entries: formattedEntries,
      pagination,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Format field-level changes for display
 * Compares oldValue and newValue to identify changed fields
 */
function formatFieldChanges(
  oldValue: any,
  newValue: any
): Array<{ field: string; oldValue: any; newValue: any }> {
  const changes: Array<{ field: string; oldValue: any; newValue: any }> = []

  // Handle null or undefined values
  if (!oldValue && !newValue) {
    return changes
  }

  // If oldValue is null, this is a CREATE action
  if (!oldValue && newValue) {
    // For CREATE, show all fields as new
    const newObj = typeof newValue === 'string' ? JSON.parse(newValue) : newValue
    Object.keys(newObj).forEach((key) => {
      // Skip internal fields
      if (!['id', 'createdAt', 'updatedAt', 'enteredById'].includes(key)) {
        changes.push({
          field: key,
          oldValue: null,
          newValue: newObj[key],
        })
      }
    })
    return changes
  }

  // If newValue is null, this is a DELETE action
  if (oldValue && !newValue) {
    const oldObj = typeof oldValue === 'string' ? JSON.parse(oldValue) : oldValue
    Object.keys(oldObj).forEach((key) => {
      // Skip internal fields
      if (!['id', 'createdAt', 'updatedAt', 'enteredById'].includes(key)) {
        changes.push({
          field: key,
          oldValue: oldObj[key],
          newValue: null,
        })
      }
    })
    return changes
  }

  // For UPDATE, compare fields
  const oldObj = typeof oldValue === 'string' ? JSON.parse(oldValue) : oldValue
  const newObj = typeof newValue === 'string' ? JSON.parse(newValue) : newValue

  // Get all unique keys from both objects
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])

  allKeys.forEach((key) => {
    // Skip internal fields and timestamps
    if (['id', 'createdAt', 'updatedAt', 'enteredById'].includes(key)) {
      return
    }

    const oldVal = oldObj[key]
    const newVal = newObj[key]

    // Check if values are different
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({
        field: key,
        oldValue: oldVal,
        newValue: newVal,
      })
    }
  })

  return changes
}
