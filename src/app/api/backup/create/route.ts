import { NextRequest } from 'next/server'
import { prisma } from '@/services/prisma'
import { checkAuth, checkRole } from '@/middleware/auth'
import {
  successResponse,
  handleApiError,
  validationError,
} from '@/utils/api-response'
import { backupCreationSchema } from '@/utils/validators'
import { createAuditLog, extractRequestMetadata } from '@/utils/audit'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import Papa from 'papaparse'

/**
 * POST /api/backup/create
 * 
 * Create a backup of inventory data and optionally audit logs
 * 
 * Request Body:
 * - fileType: BackupFileType (CSV, JSON, SQL)
 * - includeAudit: boolean (optional, default: false)
 * 
 * Requirements: 8.1, 8.4
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

    // Parse and validate request body
    const body = await request.json()
    const validationResult = backupCreationSchema.safeParse(body)

    if (!validationResult.success) {
      return validationError('Invalid request body', validationResult.error.errors)
    }

    const { fileType, includeAudit } = validationResult.data

    // Create backup record with status=IN_PROGRESS
    const backup = await prisma.backup.create({
      data: {
        fileName: '', // Will be updated after file generation
        fileSize: 0,
        fileType,
        recordCount: 0,
        storagePath: '',
        status: 'IN_PROGRESS',
        createdById: context.user.id,
      },
    })

    try {
      // Export all inventory items
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: {
          deletedAt: null,
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
        orderBy: {
          createdAt: 'desc',
        },
      })

      let recordCount = inventoryItems.length

      // Format inventory data for export
      const inventoryData = inventoryItems.map((item) => ({
        id: item.id,
        itemName: item.itemName,
        batch: item.batch,
        quantity: item.quantity,
        reject: item.reject,
        destination: item.destination,
        category: item.category || '',
        notes: item.notes || '',
        enteredById: item.enteredById,
        enteredByName: item.enteredBy.name,
        enteredByEmail: item.enteredBy.email,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }))

      // If includeAudit: Export audit logs
      let auditData: any[] = []
      if (includeAudit) {
        const auditLogs = await prisma.auditLog.findMany({
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
        })

        recordCount += auditLogs.length

        auditData = auditLogs.map((log) => ({
          id: log.id,
          userId: log.userId,
          userName: log.user.name,
          userEmail: log.user.email,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId || '',
          oldValue: log.oldValue ? JSON.stringify(log.oldValue) : '',
          newValue: log.newValue ? JSON.stringify(log.newValue) : '',
          ipAddress: log.ipAddress || '',
          userAgent: log.userAgent || '',
          timestamp: log.timestamp.toISOString(),
        }))
      }

      // Generate timestamped filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const fileName = `backup-${backup.id}-${timestamp}.${fileType.toLowerCase()}`

      // Create /backups/ directory if it doesn't exist
      const backupsDir = join(process.cwd(), 'backups')
      if (!existsSync(backupsDir)) {
        await mkdir(backupsDir, { recursive: true })
      }

      const filePath = join(backupsDir, fileName)
      const storagePath = `/backups/${fileName}`

      // Format data as CSV or JSON based on fileType
      let fileContent: string
      let fileSize: number

      if (fileType === 'CSV') {
        // Generate CSV for inventory
        const inventoryCsv = Papa.unparse(inventoryData)
        
        if (includeAudit && auditData.length > 0) {
          // Generate CSV for audit logs
          const auditCsv = Papa.unparse(auditData)
          // Combine both CSVs with a separator
          fileContent = `# INVENTORY DATA\n${inventoryCsv}\n\n# AUDIT LOGS\n${auditCsv}`
        } else {
          fileContent = inventoryCsv
        }

        fileSize = Buffer.byteLength(fileContent, 'utf-8')
        await writeFile(filePath, fileContent, 'utf-8')
      } else if (fileType === 'JSON') {
        // Generate JSON
        const jsonData: any = {
          metadata: {
            backupId: backup.id,
            createdAt: new Date().toISOString(),
            createdBy: {
              id: context.user.id,
              name: context.user.name,
              email: context.user.email,
            },
            recordCount,
            includesAudit: includeAudit,
          },
          inventory: inventoryData,
        }

        if (includeAudit) {
          jsonData.auditLogs = auditData
        }

        fileContent = JSON.stringify(jsonData, null, 2)
        fileSize = Buffer.byteLength(fileContent, 'utf-8')
        await writeFile(filePath, fileContent, 'utf-8')
      } else {
        // SQL format not implemented in this version
        throw new Error('SQL backup format is not yet implemented')
      }

      // Update backup status=COMPLETED
      const updatedBackup = await prisma.backup.update({
        where: { id: backup.id },
        data: {
          fileName,
          fileSize,
          recordCount,
          storagePath,
          status: 'COMPLETED',
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Create audit log
      const metadata = extractRequestMetadata(request)
      await createAuditLog({
        userId: context.user.id,
        action: 'CREATE',
        entity: 'Backup',
        entityId: backup.id,
        changes: {
          newValue: {
            id: backup.id,
            fileName,
            fileType,
            recordCount,
            includeAudit,
          },
        },
        metadata,
      })

      // Return backup record
      return successResponse(
        {
          id: updatedBackup.id,
          fileName: updatedBackup.fileName,
          fileSize: updatedBackup.fileSize,
          fileType: updatedBackup.fileType,
          recordCount: updatedBackup.recordCount,
          storagePath: updatedBackup.storagePath,
          status: updatedBackup.status,
          createdAt: updatedBackup.createdAt.toISOString(),
          createdBy: updatedBackup.createdBy,
        },
        'Backup created successfully',
        201
      )
    } catch (error) {
      // Update backup status to FAILED
      await prisma.backup.update({
        where: { id: backup.id },
        data: {
          status: 'FAILED',
        },
      })

      throw error
    }
  } catch (error) {
    return handleApiError(error)
  }
}
