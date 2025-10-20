import { NextRequest } from 'next/server';
import { auth } from '@/services/auth';
import { AuditService } from '@/services/audit';
import {
  successResponse,
  authRequiredError,
  insufficientPermissionsError,
  handleApiError,
} from '@/utils/api-response';

/**
 * GET /api/audit/logs
 * Query audit logs with filtering and pagination
 * Requires AUDITOR or ADMIN role
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Filters
    const dateFrom = searchParams.get('dateFrom')
      ? new Date(searchParams.get('dateFrom')!)
      : undefined;
    const dateTo = searchParams.get('dateTo')
      ? new Date(searchParams.get('dateTo')!)
      : undefined;
    const userIds = searchParams.get('userIds')?.split(',').filter(Boolean);
    const actions = searchParams
      .get('actions')
      ?.split(',')
      .filter(Boolean) as any[];
    const entityTypes = searchParams
      .get('entityTypes')
      ?.split(',')
      .filter(Boolean) as any[];
    const search = searchParams.get('search') || undefined;

    // Query logs
    const result = await AuditService.queryLogs(
      {
        dateFrom,
        dateTo,
        userIds,
        actions,
        entityTypes,
        search,
      },
      { page, limit }
    );

    return successResponse({
      entries: result.entries,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
