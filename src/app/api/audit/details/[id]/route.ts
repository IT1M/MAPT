import { NextRequest } from 'next/server';
import { auth } from '@/services/auth';
import { AuditService } from '@/services/audit';
import {
  successResponse,
  authRequiredError,
  insufficientPermissionsError,
  handleApiError,
  notFoundError,
} from '@/utils/api-response';

/**
 * GET /api/audit/details/:id
 * Get full details for a specific audit entry
 * Requires AUDITOR or ADMIN role
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get entry details
    const { id } = await params;
    const result = await AuditService.getEntryDetails(id);

    if (!result.entry) {
      return notFoundError('Audit entry not found');
    }

    return successResponse(result);
  } catch (error: any) {
    if (error.code === 'AUDIT_ENTRY_NOT_FOUND') {
      return notFoundError('Audit entry not found');
    }
    return handleApiError(error);
  }
}
