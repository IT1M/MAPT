import { NextRequest } from 'next/server'
import { checkAuth, checkRole } from '@/middleware/auth'
import { handleApiError, validationError } from '@/utils/api-response'
import { BackupService } from '@/services/backup'
import { prisma } from '@/services/prisma'
import { AuditService } from '@/services/audit'
import { readFile } from 'fs/promises'

/**
 * GET /api/backup/download/[id]
 * 
 * Download a backup file
 * 
 * Requirements: 16
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult

    // Check role (ADMIN or MANAGER)
    const isAdmin = context.user.role === 'ADMIN'
    const isManager = context.user.role === 'MANAGER'
    
    if (!isAdmin && !isManager) {
      const roleCheck = checkRole('MANAGER', context)
      if ('error' in roleCheck) {
        return roleCheck.error
      }
    }

    const backupId = params.id

    // Get backup record
    const backup: any = await prisma.backup.findUnique({
      where: { id: backupId },
    })

    if (!backup) {
      return validationError('Backup not found')
    }

    if (backup.status !== 'COMPLETED') {
      return validationError('Cannot download incomplete backup')
    }

    // Get file path
    const filePath = BackupService.getBackupFilePath(backup.filename, backup.encrypted)

    // Read file
    let fileBuffer: Buffer
    try {
      fileBuffer = await readFile(filePath)
    } catch (error) {
      return validationError('Backup file not found on disk')
    }

    // Log download to audit trail
    await AuditService.logAction({
      userId: context.user.id,
      action: 'EXPORT',
      entityType: 'Backup',
      entityId: backupId,
      changes: { filename: backup.filename },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    })

    // Determine content type based on format
    let contentType = 'application/octet-stream'
    const format = backup.format as string
    if (format === 'CSV') {
      contentType = 'text/csv'
    } else if (format === 'JSON') {
      contentType = 'application/json'
    } else if (format === 'SQL') {
      contentType = 'application/sql'
    }

    // Return file with appropriate headers
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${backup.filename}${backup.encrypted ? '.encrypted' : ''}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
