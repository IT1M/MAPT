import { NextRequest } from 'next/server'
import { prisma } from '@/services/prisma'
import { checkAuth, checkRole } from '@/middleware/auth'
import {
  successResponse,
  handleApiError,
} from '@/utils/api-response'

/**
 * GET /api/backup/list
 * 
 * List all backups sorted by creation date
 * 
 * Requirements: 8.2
 */
export async function GET(request: NextRequest) {
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

    // Query all backups sorted by createdAt descending
    const backups = await prisma.backup.findMany({
      include: {
        createdBy: {
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

    // Return backups array with file size and record count
    return successResponse({
      backups: backups.map((backup) => ({
        id: backup.id,
        fileName: backup.fileName,
        fileSize: backup.fileSize,
        fileType: backup.fileType,
        recordCount: backup.recordCount,
        storagePath: backup.storagePath,
        status: backup.status,
        createdAt: backup.createdAt.toISOString(),
        createdBy: backup.createdBy,
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
