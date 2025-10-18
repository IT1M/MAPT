import { NextRequest } from 'next/server'
import { reportService } from '@/services/report'
import { checkAuth } from '@/middleware/auth'
import { 
  successResponse,
  handleApiError,
  insufficientPermissionsError,
  notFoundError 
} from '@/utils/api-response'
import { z } from 'zod'

/**
 * POST /api/reports/email
 * 
 * Email an existing report to recipients
 * 
 * Body:
 * - reportId: string
 * - recipients: string[]
 * - subject: string
 * - message: string
 * 
 * Requirements: 25
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult

    // Check permissions (ADMIN, MANAGER can email reports)
    const allowedRoles = ['ADMIN', 'MANAGER']
    if (!allowedRoles.includes(context.user.role)) {
      return insufficientPermissionsError('Permission to email reports required')
    }

    // Parse request body
    const body = await request.json()

    const emailSchema = z.object({
      reportId: z.string(),
      recipients: z.array(z.string().email()).min(1, 'At least one recipient required'),
      subject: z.string().min(1, 'Subject is required'),
      message: z.string().optional().default(''),
    })

    const emailResult = emailSchema.safeParse(body)

    if (!emailResult.success) {
      return handleApiError(emailResult.error)
    }

    const { reportId, recipients, subject, message } = emailResult.data

    // Check if report exists
    const report = await reportService.getReportById(reportId)
    if (!report) {
      return notFoundError('Report not found')
    }

    // Send email
    await reportService.emailReport(reportId, recipients, subject, message)

    return successResponse(
      {
        reportId,
        recipients,
        message: 'Report emailed successfully',
      },
      'Report emailed successfully'
    )
  } catch (error) {
    return handleApiError(error)
  }
}
