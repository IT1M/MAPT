import { NextRequest } from 'next/server'
import { reportService } from '@/services/report'
import { checkAuth } from '@/middleware/auth'
import { 
  successResponse, 
  handleApiError,
  insufficientPermissionsError 
} from '@/utils/api-response'
import { z } from 'zod'
import { ReportType } from '@prisma/client'

/**
 * GET /api/reports/list
 * 
 * List all reports with filtering and pagination
 * 
 * Query Parameters:
 * - type: ReportType (optional)
 * - search: string (optional)
 * - dateFrom: ISO date string (optional)
 * - dateTo: ISO date string (optional)
 * - page: number (default: 1)
 * - limit: number (default: 10, max: 50)
 * 
 * Requirements: 25
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult

    // Check permissions (ADMIN, MANAGER, AUDITOR can view reports)
    const allowedRoles = ['ADMIN', 'MANAGER', 'AUDITOR']
    if (!allowedRoles.includes(context.user.role)) {
      return insufficientPermissionsError('Permission to view reports required')
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    
    const querySchema = z.object({
      type: z.nativeEnum(ReportType).optional(),
      search: z.string().optional(),
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(50).optional().default(10),
    })

    const queryResult = querySchema.safeParse({
      type: searchParams.get('type'),
      search: searchParams.get('search'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    if (!queryResult.success) {
      return handleApiError(queryResult.error)
    }

    const { type, search, dateFrom, dateTo, page, limit } = queryResult.data

    // Build filters
    const filters: any = {
      page,
      limit,
    }

    if (type) {
      filters.type = type
    }

    if (search) {
      filters.search = search
    }

    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom)
    }

    if (dateTo) {
      filters.dateTo = new Date(dateTo)
    }

    // Get reports from service
    const { reports, total } = await reportService.listReports(filters)

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return successResponse({
      reports,
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
