import { NextRequest } from 'next/server';
import { reportService } from '@/services/report';
import { checkAuth } from '@/middleware/auth';
import {
  handleApiError,
  insufficientPermissionsError,
  notFoundError,
  validationError,
} from '@/utils/api-response';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * GET /api/reports/preview/:id
 *
 * Preview a report (PDF only) in browser
 *
 * Requirements: 25
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const authResult = await checkAuth();
    if ('error' in authResult) {
      return authResult.error;
    }

    const { context } = authResult;

    // Check permissions (ADMIN, MANAGER, AUDITOR can preview reports)
    const allowedRoles = ['ADMIN', 'MANAGER', 'AUDITOR'];
    if (!allowedRoles.includes(context.user.role)) {
      return insufficientPermissionsError(
        'Permission to preview reports required'
      );
    }

    const reportId = (await params).id;

    // Get report from database
    const report = await reportService.getReportById(reportId);

    if (!report) {
      return notFoundError('Report not found');
    }

    if (!report.filePath) {
      return notFoundError('Report file not found');
    }

    // Check if file is PDF (only PDFs can be previewed)
    const ext = path.extname(report.filePath).toLowerCase();
    if (ext !== '.pdf' && ext !== '.txt') {
      return validationError('Only PDF reports can be previewed');
    }

    // Read file
    const fileBuffer = await readFile(report.filePath);

    // Return file for inline display
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
