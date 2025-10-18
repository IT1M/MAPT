import { NextRequest } from 'next/server'
import { prisma } from '@/services/prisma'
import { checkAuth } from '@/middleware/auth'
import { 
  handleApiError,
  notFoundError,
  insufficientPermissionsError 
} from '@/utils/api-response'
import { createAuditLog, extractRequestMetadata } from '@/utils/audit'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { z } from 'zod'

/**
 * GET /api/reports/[id]/download
 * 
 * Download a report PDF file
 * 
 * Path Parameters:
 * - id: Report UUID
 * 
 * Requirements: 7.3
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

    // Check permissions (reports:view required)
    if (!context.user.permissions.includes('reports:view')) {
      return insufficientPermissionsError('Permission to download reports required')
    }

    // Validate UUID parameter
    const paramSchema = z.object({
      id: z.string().cuid('Invalid report ID'),
    })

    const paramResult = paramSchema.safeParse(params)
    if (!paramResult.success) {
      return notFoundError('Invalid report ID')
    }

    const { id } = paramResult.data

    // Fetch report record
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        generatedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!report) {
      return notFoundError('Report not found')
    }

    // Check role-based access (DATA_ENTRY can only download their own reports)
    if (context.user.role === 'DATA_ENTRY' && report.generatedById !== context.user.id) {
      return insufficientPermissionsError('You can only download your own reports')
    }

    // Check if report has a file URL
    if (!report.fileUrl) {
      return notFoundError('Report file not available')
    }

    // Verify file exists
    const filePath = join(process.cwd(), 'public', report.fileUrl)
    if (!existsSync(filePath)) {
      return notFoundError('Report file not found on server')
    }

    // Read file
    const fileBuffer = await readFile(filePath)

    // Create audit log
    const metadata = extractRequestMetadata(request)
    await createAuditLog({
      userId: context.user.id,
      action: 'EXPORT',
      entity: 'Report',
      entityId: report.id,
      changes: {
        newValue: {
          reportId: report.id,
          title: report.title,
          action: 'download',
        },
      },
      metadata,
    })

    // Stream PDF file with appropriate headers
    const fileName = report.fileUrl.split('/').pop() || 'report.pdf'
    
    return new Response(fileBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
