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
 * List all backups with pagination, filtering, and search
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 25)
 * - type: BackupType filter (MANUAL, AUTOMATIC, PRE_RESTORE)
 * - status: BackupStatus filter (IN_PROGRESS, COMPLETED, FAILED, CORRUPTED)
 * - search: string (search by filename)
 * 
 * Requirements: 14
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {}
    
    if (type) {
      where.type = type
    }
    
    if (status) {
      where.status = status
    }
    
    if (search) {
      where.filename = {
        contains: search,
        mode: 'insensitive',
      }
    }

    // Get total count
    const total = await prisma.backup.count({ where })

    // Query backups with pagination
    const backups = await prisma.backup.findMany({
      where,
      include: {
        creator: {
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
      skip: (page - 1) * limit,
      take: limit,
    })

    // Return backups with pagination info
    return successResponse({
      backups: backups.map((backup: any) => ({
        id: backup.id,
        filename: backup.filename,
        type: backup.type,
        format: backup.format,
        fileSize: backup.fileSize.toString(),
        recordCount: backup.recordCount,
        status: backup.status,
        createdAt: backup.createdAt.toISOString(),
        createdBy: backup.creator,
        includeAuditLogs: backup.includeAuditLogs,
        includeUserData: backup.includeUserData,
        includeSettings: backup.includeSettings,
        dateRangeFrom: backup.dateRangeFrom?.toISOString(),
        dateRangeTo: backup.dateRangeTo?.toISOString(),
        notes: backup.notes,
        encrypted: backup.encrypted,
        validated: backup.validated,
        validatedAt: backup.validatedAt?.toISOString(),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
