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
 * GET /api/audit/stats
 * Get audit statistics for dashboard
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
    const dateFrom = searchParams.get('dateFrom') 
      ? new Date(searchParams.get('dateFrom')!) 
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: last 7 days
    const dateTo = searchParams.get('dateTo') 
      ? new Date(searchParams.get('dateTo')!) 
      : new Date(); // Default: now

    // Get statistics
    const stats = await AuditService.getStatistics({ from: dateFrom, to: dateTo });

    return successResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
