import { NextRequest } from 'next/server'
import { prisma } from '@/services/prisma'
import { checkAuth } from '@/middleware/auth'
import { 
  successResponse, 
  handleApiError,
  insufficientPermissionsError 
} from '@/utils/api-response'
import { z } from 'zod'
import { stat } from 'fs/promises'
import { join } from 'path'

/**
 * GET /api/reports
 * 
 * List all reports with filtering and pagination
 * 
 * Query Parameters:
 * - type: ReportType (optional)
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 200)
 * 
 * Requirements: 7.2
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult

    // Check permissions (reports:view required)
    if (!context.user.permissions.includes('reports:view')) {
      return insufficientPermissionsError('Permission to view reports required')
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    
    const querySchema = z.object({
      type: z.enum(['MONTHLY', 'YEARLY', 'CUSTOM', 'AUDIT']).optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(200).optional().default(50),
    })

    const queryResult = querySchema.safeParse({
      type: searchParams.get('type'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    if (!queryResult.success) {
      return handleApiError(queryResult.error)
    }

    const { type, startDate, endDate, page, limit } = queryResult.data

    // Build where clause
    const whereClause: any = {}

    if (type) {
      whereClause.type = type
    }

    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate)
      }
    }

    // Apply role-based filtering (DATA_ENTRY sees only their reports)
    if (context.user.role === 'DATA_ENTRY') {
      whereClause.generatedById = context.user.id
    }

    // Get total count for pagination
    const total = await prisma.report.count({
      where: whereClause,
    })

    // Fetch reports with pagination
    const reports = await prisma.report.findMany({
      where: whereClause,
      include: {
        generatedBy: {
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

    // Get file size metadata for each report
    const reportsWithMetadata = await Promise.all(
      reports.map(async (report) => {
        let fileSize: number | null = null

        if (report.fileUrl) {
          try {
            const filePath = join(process.cwd(), 'public', report.fileUrl)
            const stats = await stat(filePath)
            fileSize = stats.size
          } catch (error) {
            console.error(`Failed to get file size for report ${report.id}:`, error)
          }
        }

        return {
          id: report.id,
          title: report.title,
          type: report.type,
          periodStart: report.periodStart.toISOString(),
          periodEnd: report.periodEnd.toISOString(),
          status: report.status,
          fileUrl: report.fileUrl,
          fileSize,
          createdAt: report.createdAt.toISOString(),
          generatedBy: report.generatedBy,
        }
      })
    )

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return successResponse({
      reports: reportsWithMetadata,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
