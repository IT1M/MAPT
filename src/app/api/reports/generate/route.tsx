import { NextRequest } from 'next/server'
import { reportService, ReportConfig } from '@/services/report'
import { checkAuth } from '@/middleware/auth'
import { 
  successResponse, 
  handleApiError,
  insufficientPermissionsError,
  validationError 
} from '@/utils/api-response'
import { z } from 'zod'
import { ReportType, ReportFormat } from '@prisma/client'

/**
 * POST /api/reports/generate
 * 
 * Generate a new report
 * 
 * Body:
 * - type: ReportType
 * - dateRange: { from: Date, to: Date }
 * - content: object with boolean flags
 * - format: ReportFormat
 * - customization: object with report options
 * - email: optional email settings
 * 
 * Requirements: 21, 22
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult

    // Check permissions (ADMIN, MANAGER can generate reports)
    const allowedRoles = ['ADMIN', 'MANAGER']
    if (!allowedRoles.includes(context.user.role)) {
      return insufficientPermissionsError('Permission to generate reports required')
    }

    // Parse request body
    const body = await request.json()

    const configSchema = z.object({
      type: z.nativeEnum(ReportType),
      dateRange: z.object({
        from: z.string().datetime().transform(str => new Date(str)),
        to: z.string().datetime().transform(str => new Date(str)),
      }),
      content: z.object({
        summary: z.boolean().default(true),
        charts: z.boolean().default(true),
        detailedTable: z.boolean().default(true),
        rejectAnalysis: z.boolean().default(true),
        destinationBreakdown: z.boolean().default(true),
        categoryAnalysis: z.boolean().default(true),
        aiInsights: z.boolean().default(false),
        userActivity: z.boolean().default(false),
        auditTrail: z.boolean().default(false),
        comparative: z.boolean().default(false),
      }),
      format: z.nativeEnum(ReportFormat),
      customization: z.object({
        includeLogo: z.boolean().default(true),
        includeSignature: z.boolean().default(true),
        language: z.enum(['en', 'ar', 'bilingual']).default('en'),
        paperSize: z.enum(['a4', 'letter']).default('a4'),
        orientation: z.enum(['portrait', 'landscape']).default('portrait'),
      }),
      email: z.object({
        enabled: z.boolean(),
        recipients: z.array(z.string().email()),
        subject: z.string(),
        message: z.string(),
      }).optional(),
    })

    const configResult = configSchema.safeParse(body)

    if (!configResult.success) {
      return handleApiError(configResult.error)
    }

    const config: ReportConfig = configResult.data as any

    // Validate date range
    if (config.dateRange.from >= config.dateRange.to) {
      return validationError('Start date must be before end date')
    }

    // Generate report
    const reportId = await reportService.generateReport(
      config,
      context.user.id,
      undefined // No progress callback for API
    )

    return successResponse(
      {
        reportId,
        status: 'completed',
        message: 'Report generated successfully',
      },
      'Report generated successfully',
      201
    )
  } catch (error) {
    return handleApiError(error)
  }
}
