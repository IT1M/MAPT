/**
 * Example usage of database helper functions
 * This file demonstrates how to use the utilities in db-helpers.ts
 */

import { prisma } from '@/services/prisma'
import {
  withTransaction,
  safeQuery,
  paginateQuery,
  paginateWithCursor,
  batchProcess,
  upsertRecord,
  findOrCreate,
  recordExists,
  getRecordOrThrow,
  buildDateRangeFilter,
  buildSearchFilter,
  aggregateData,
  handlePrismaError,
} from './db-helpers'

/**
 * Example 1: Using transaction wrapper for atomic operations
 * Creates an inventory item and audit log in a single transaction
 */
export async function createInventoryWithAudit(
  itemData: any,
  userId: string
) {
  return await withTransaction(async (tx) => {
    // Create inventory item
    const item = await tx.inventoryItem.create({
      data: itemData,
    })

    // Create audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entityType: 'InventoryItem',
        entityId: item.id,
        newValue: itemData,
        timestamp: new Date(),
      },
    })

    return item
  })
}

/**
 * Example 2: Using safe query wrapper
 * Handles errors gracefully without throwing
 */
export async function getUserSafely(email: string) {
  const { data, error } = await safeQuery(() =>
    prisma.user.findUnique({
      where: { email },
    })
  )

  if (error) {
    console.error('Failed to fetch user:', error.message)
    return null
  }

  return data
}

/**
 * Example 3: Offset-based pagination
 * Good for traditional page-based navigation
 */
export async function getInventoryItemsPaginated(page: number, pageSize: number) {
  return await paginateQuery(
    prisma.inventoryItem,
    {
      page,
      pageSize,
      where: { destination: 'MAIS' },
      orderBy: { createdAt: 'desc' },
      include: { enteredBy: true },
    },
    10 // default page size
  )
}

/**
 * Example 4: Cursor-based pagination
 * Good for infinite scroll
 */
export async function getInventoryItemsInfiniteScroll(cursor?: string) {
  return await paginateWithCursor(
    prisma.inventoryItem,
    {
      cursor,
      pageSize: 20,
      where: { destination: 'FOZAN' },
      orderBy: { createdAt: 'desc' },
    }
  )
}

/**
 * Example 5: Batch processing
 * Process large datasets in chunks
 */
export async function updateInventoryItemsInBatches(
  itemIds: string[],
  updateData: any
) {
  return await batchProcess(
    itemIds,
    50, // batch size
    async (batch) => {
      const results = await Promise.all(
        batch.map((id) =>
          prisma.inventoryItem.update({
            where: { id },
            data: updateData,
          })
        )
      )
      return results
    }
  )
}

/**
 * Example 6: Upsert operation
 * Create or update system setting
 */
export async function updateSystemSetting(
  key: string,
  value: any,
  category: string,
  userId: string
) {
  return await upsertRecord(
    prisma.systemSettings,
    { key },
    {
      key,
      value,
      category,
      updatedById: userId,
    },
    {
      value,
      updatedById: userId,
    }
  )
}

/**
 * Example 7: Find or create
 * Get existing user or create new one
 */
export async function ensureUserExists(email: string, userData: any) {
  const { record, created } = await findOrCreate(
    prisma.user,
    { email },
    userData
  )

  if (created) {
    console.log('New user created:', email)
  } else {
    console.log('Existing user found:', email)
  }

  return record
}

/**
 * Example 8: Check if record exists
 * Validate before creating
 */
export async function validateUniqueEmail(email: string) {
  const exists = await recordExists(prisma.user, { email })

  if (exists) {
    throw new Error('Email already in use')
  }

  return true
}

/**
 * Example 9: Get record or throw
 * Fetch user and throw error if not found
 */
export async function getUserOrFail(userId: string) {
  return await getRecordOrThrow(
    prisma.user,
    { id: userId },
    { inventoryItems: true }
  )
}

/**
 * Example 10: Date range filtering
 * Get inventory items created in a date range
 */
export async function getInventoryByDateRange(
  startDate: Date,
  endDate: Date
) {
  const dateFilter = buildDateRangeFilter({
    startDate,
    endDate,
    field: 'createdAt',
  })

  return await prisma.inventoryItem.findMany({
    where: dateFilter,
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Example 11: Search across multiple fields
 * Search inventory items by name or batch
 */
export async function searchInventoryItems(searchTerm: string) {
  const searchFilter = buildSearchFilter(searchTerm, ['itemName', 'batch', 'category'])

  return await prisma.inventoryItem.findMany({
    where: searchFilter,
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Example 12: Aggregate data
 * Get inventory statistics
 */
export async function getInventoryStats(destination?: string) {
  return await aggregateData(
    prisma.inventoryItem,
    destination ? { destination } : {},
    {
      count: true,
      sum: ['quantity', 'reject'],
      avg: ['quantity'],
      min: ['quantity'],
      max: ['quantity'],
    }
  )
}

/**
 * Example 13: Error handling
 * Handle Prisma errors gracefully
 */
export async function createUserWithErrorHandling(userData: any) {
  try {
    return await prisma.user.create({
      data: userData,
    })
  } catch (error) {
    const dbError = handlePrismaError(error)
    console.error('Database error:', dbError.message)
    throw dbError
  }
}

/**
 * Example 14: Complex transaction with multiple operations
 * Transfer inventory between destinations with audit trail
 */
export async function transferInventory(
  itemId: string,
  newDestination: 'MAIS' | 'FOZAN',
  userId: string
) {
  return await withTransaction(async (tx) => {
    // Get current item
    const currentItem = await tx.inventoryItem.findUniqueOrThrow({
      where: { id: itemId },
    })

    // Update destination
    const updatedItem = await tx.inventoryItem.update({
      where: { id: itemId },
      data: { destination: newDestination },
    })

    // Create audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entityType: 'InventoryItem',
        entityId: itemId,
        oldValue: { destination: currentItem.destination },
        newValue: { destination: newDestination },
        timestamp: new Date(),
      },
    })

    return updatedItem
  })
}
