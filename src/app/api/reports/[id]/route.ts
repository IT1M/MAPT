import { NextRequest } from 'next/server'
import { reportService } from '@/services/report'
import { AuditService } from '@/services/audit'
import { checkAuth } from '@/middleware/auth'
import { 
  successResponse,
  handleApiError,
  insufficientPermissionsError,
  notFoundError 
} from '@/utils/api-response'

/**
 * DELETE /api/reports/:id
 * 
 * Delete a report
 * 
 * Requirements: 25
 */
export async function DELETE(
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

    // Check permissions (ADMIN, MANAGER can delete reports)
    const allowedRoles = ['ADMIN', 'MANAGER']
    if (!allowedRoles.includes(context.user.role)) {
      return insufficientPermissionsError('Permission to delete reports required')
    }

    const reportId = params.id

    // Check if report exists
    const report = await reportService.getReportById(reportId)
    if (!report) {
      return notFoundError('Report not found')
    }

    // Delete report
    await reportService.deleteReport(reportId)

    // Log deletion in audit trail
    await AuditService.logAction({
      userId: context.user.id,
      action: 'DELETE',
      entityType: 'Report',
      entityId: reportId,
      changes: {
        title: { old: report.title, new: null },
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    })

    return successResponse(
      {
        reportId,
        message: 'Report deleted successfully',
      },
      'Report deleted successfully'
    )
  } catch (error) {
    return handleApiError(error)
  }
}
