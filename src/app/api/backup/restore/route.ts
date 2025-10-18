import { NextRequest } from 'next/server'
import { prisma } from '@/services/prisma'
import { checkAuth, checkRole } from '@/middleware/auth'
import {
  successResponse,
  handleApiError,
  validationError,
} from '@/utils/api-response'
import { createAuditLog, extractRequestMetadata } from '@/utils/audit'
import Papa from 'papaparse'

/**
 * POST /api/backup/restore
 * 
 * Restore inventory data from a backup file
 * 
 * Request: Multipart form data with backup file
 * Query Parameters:
 * - dryRun: boolean (optional, default: false) - Preview changes without applying
 * 
 * Requirements: 8.3
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult

    // Check role (ADMIN only)
    const roleCheck = checkRole('ADMIN', context)
    if ('error' in roleCheck) {
      return roleCheck.error
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const dryRun = searchParams.get('dryRun') === 'true'

    // Parse uploaded backup file
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return validationError('No backup file provided')
    }

    // Read file content
    const fileContent = await file.text()
    const fileName = file.name.toLowerCase()

    // Validate file format and structure
    let backupData: any
    let inventoryItems: any[] = []
    let auditLogs: any[] = []

    try {
      if (fileName.endsWith('.json')) {
        // Parse JSON backup
        backupData = JSON.parse(fileContent)

        // Validate JSON structure
        if (!backupData.inventory || !Array.isArray(backupData.inventory)) {
          return validationError('Invalid backup file structure: missing inventory array')
        }

        inventoryItems = backupData.inventory
        auditLogs = backupData.auditLogs || []
      } else if (fileName.endsWith('.csv')) {
        // Parse CSV backup
        const lines = fileContent.split('\n')
        
        // Check if file contains both inventory and audit data
        const auditIndex = lines.findIndex(line => line.includes('# AUDIT LOGS'))
        
        if (auditIndex > 0) {
          // Split inventory and audit sections
          const inventorySection = lines.slice(0, auditIndex).join('\n')
          const auditSection = lines.slice(auditIndex + 1).join('\n')
          
          // Parse inventory CSV
          const inventoryResult = Papa.parse(inventorySection, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
          })
          inventoryItems = inventoryResult.data.filter((row: any) => 
            row.id && row.itemName && row.batch
          )
          
          // Parse audit CSV if present
          if (auditSection.trim()) {
            const auditResult = Papa.parse(auditSection, {
              header: true,
              skipEmptyLines: true,
              dynamicTyping: true,
            })
            auditLogs = auditResult.data.filter((row: any) => row.id)
          }
        } else {
          // Only inventory data
          const result = Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
          })
          inventoryItems = result.data.filter((row: any) => 
            row.id && row.itemName && row.batch
          )
        }
      } else {
        return validationError('Unsupported file format. Only JSON and CSV are supported')
      }
    } catch (error) {
      return validationError('Failed to parse backup file: ' + (error as Error).message)
    }

    // Validate inventory items structure
    const validationErrors: string[] = []
    inventoryItems.forEach((item, index) => {
      if (!item.itemName || typeof item.itemName !== 'string') {
        validationErrors.push(`Row ${index + 1}: Missing or invalid itemName`)
      }
      if (!item.batch || typeof item.batch !== 'string') {
        validationErrors.push(`Row ${index + 1}: Missing or invalid batch`)
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        validationErrors.push(`Row ${index + 1}: Invalid quantity`)
      }
      if (!item.destination || !['MAIS', 'FOZAN'].includes(item.destination)) {
        validationErrors.push(`Row ${index + 1}: Invalid destination`)
      }
    })

    if (validationErrors.length > 0) {
      return validationError('Backup file validation failed', validationErrors)
    }

    // Preview changes (dry run mode)
    const preview = {
      inventoryItemsToRestore: inventoryItems.length,
      auditLogsToRestore: auditLogs.length,
      totalRecords: inventoryItems.length + auditLogs.length,
      sampleItems: inventoryItems.slice(0, 5).map((item) => ({
        itemName: item.itemName,
        batch: item.batch,
        quantity: item.quantity,
        destination: item.destination,
      })),
    }

    // If dry run, return preview without executing restore
    if (dryRun) {
      return successResponse(
        {
          dryRun: true,
          preview,
          message: 'Preview mode: No changes were made',
        },
        'Backup file validated successfully'
      )
    }

    // Execute restore in Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      let restoredInventoryCount = 0
      let restoredAuditCount = 0

      // Restore inventory items
      for (const item of inventoryItems) {
        // Check if item already exists
        const existing = await tx.inventoryItem.findUnique({
          where: { id: item.id },
        })

        if (existing) {
          // Update existing item
          await tx.inventoryItem.update({
            where: { id: item.id },
            data: {
              itemName: item.itemName,
              batch: item.batch,
              quantity: item.quantity,
              reject: item.reject || 0,
              destination: item.destination,
              category: item.category || null,
              notes: item.notes || null,
              enteredById: item.enteredById || context.user.id,
              updatedAt: new Date(),
            },
          })
        } else {
          // Create new item
          await tx.inventoryItem.create({
            data: {
              id: item.id,
              itemName: item.itemName,
              batch: item.batch,
              quantity: item.quantity,
              reject: item.reject || 0,
              destination: item.destination,
              category: item.category || null,
              notes: item.notes || null,
              enteredById: item.enteredById || context.user.id,
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
              updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
            },
          })
        }
        restoredInventoryCount++
      }

      // Restore audit logs if present (optional)
      if (auditLogs.length > 0) {
        for (const log of auditLogs) {
          // Check if audit log already exists
          const existing = await tx.auditLog.findUnique({
            where: { id: log.id },
          })

          if (!existing) {
            // Create audit log entry
            await tx.auditLog.create({
              data: {
                id: log.id,
                userId: log.userId || context.user.id,
                action: log.action,
                entityType: log.entityType,
                entityId: log.entityId || null,
                oldValue: log.oldValue ? JSON.parse(log.oldValue) : null,
                newValue: log.newValue ? JSON.parse(log.newValue) : null,
                ipAddress: log.ipAddress || null,
                userAgent: log.userAgent || null,
                timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
              },
            })
            restoredAuditCount++
          }
        }
      }

      return {
        restoredInventoryCount,
        restoredAuditCount,
      }
    })

    // Create audit log with action=RESTORE
    const metadata = extractRequestMetadata(request)
    await createAuditLog({
      userId: context.user.id,
      action: 'CREATE', // Using CREATE as RESTORE is not in the enum
      entity: 'Backup',
      entityId: 'restore',
      changes: {
        newValue: {
          fileName: file.name,
          restoredInventoryCount: result.restoredInventoryCount,
          restoredAuditCount: result.restoredAuditCount,
          totalRestored: result.restoredInventoryCount + result.restoredAuditCount,
        },
      },
      metadata,
    })

    // Return success with restored count
    return successResponse(
      {
        restoredInventoryCount: result.restoredInventoryCount,
        restoredAuditCount: result.restoredAuditCount,
        totalRestored: result.restoredInventoryCount + result.restoredAuditCount,
        preview,
      },
      'Backup restored successfully'
    )
  } catch (error) {
    return handleApiError(error)
  }
}
