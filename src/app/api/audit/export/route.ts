import { NextRequest } from 'next/server';
import { auth } from '@/services/auth';
import { AuditService } from '@/services/audit';
import {
  authRequiredError,
  insufficientPermissionsError,
  handleApiError,
  validationError,
} from '@/utils/api-response';

/**
 * POST /api/audit/export
 * Export audit logs to CSV, Excel, or PDF
 * Requires AUDITOR or ADMIN role
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return authRequiredError();
    }

    // Check role - AUDITOR or ADMIN required
    const allowedRoles = ['AUDITOR', 'ADMIN'];
    if (!allowedRoles.includes(session.user.role)) {
      return insufficientPermissionsError('AUDITOR or ADMIN role required');
    }

    // Parse request body
    const body = await request.json();
    const { format, filters, encrypted } = body;

    if (!format || !['csv', 'excel', 'pdf'].includes(format)) {
      return validationError('Invalid format. Must be csv, excel, or pdf');
    }

    // Parse filters
    const auditFilters = {
      dateFrom: filters?.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters?.dateTo ? new Date(filters.dateTo) : undefined,
      userIds: filters?.userIds,
      actions: filters?.actions,
      entityTypes: filters?.entityTypes,
      search: filters?.search,
    };

    // Export logs
    const { data, filename } = await AuditService.exportLogs(
      auditFilters,
      format,
      encrypted || false
    );

    // Log the export action
    await AuditService.logAction({
      userId: session.user.id,
      action: 'EXPORT',
      entityType: 'AuditLog',
      entityId: 'export',
      changes: { format, filters },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    // Determine content type
    let contentType = 'text/csv';
    if (format === 'excel') {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (format === 'pdf') {
      contentType = 'application/pdf';
    }

    // Return file
    const responseData = typeof data === 'string' ? data : Buffer.from(data);
    return new Response(responseData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    if (error.code === 'AUDIT_EXPORT_FAILED') {
      return validationError(error.message);
    }
    return handleApiError(error);
  }
}
