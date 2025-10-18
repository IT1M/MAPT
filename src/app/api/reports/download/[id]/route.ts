import { NextRequest } from 'next/server'
import { reportService } from '@/services/report'
import { AuditService } from '@/services/audit'
import { checkAuth } from '@/middleware/auth'
import { 
  handleApiError,
  insufficientPermissionsError,
  notFoundError 
} from '@/utils/api-response'
import { readFile } from 'fs/promises'
import path from 'path'

/**
 * GET /api/reports/download/:id
 * 
 * Download a generated report file
 * 
 * Requirements: 25
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

    // Check permissions (ADMIN, MANAGER, AUDITOR can download reports)
    const allowedRoles = ['ADMIN', 'MANAGER', 'AUDITOR']
    if (!allowedRoles.includes(context.user.role)) {
      return insufficientPermissionsError('Permission to download reports required')
    }

    const reportId = params.id

    // Get report from database
    const report = await reportService.getReportById(reportId)

    if (!report) {
      return notFoundError('Report not found')
    }

    if (!report.filePath) {
      return notFoundError('Report file not found')
    }

    // Read file
    const fileBuffer = await readFile(report.filePath)
    const filename = path.basename(report.filePath)

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase()
    let contentType = 'application/octet-stream'

    if (ext === '.pdf' || ext === '.txt') {
      contentType = 'application/pdf'
    } else if (ext === '.xlsx') {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } else if (ext === '.pptx') {
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    }

    // Log download in audit trail
    await AuditService.logAction({
      userId: context.user.id,
      action: 'EXPORT',
      entityType: 'Report',
      entityId: reportId,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    })

    // Return file
    return new Response(fileBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
