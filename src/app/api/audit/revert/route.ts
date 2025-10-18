import { NextRequest } from 'next/server';
import { auth } from '@/services/auth';
import { AuditService } from '@/services/audit';
import {
  successResponse,
  authRequiredError,
  insufficientPermissionsError,
  handleApiError,
  validationError,
} from '@/utils/api-response';

/**
 * POST /api/audit/revert
 * Revert a change (ADMIN only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return authRequiredError();
    }

    // Check role - ADMIN only
    if (session.user.role !== 'ADMIN') {
      return insufficientPermissionsError('ADMIN role required');
    }

    // Parse request body
    const body = await request.json();
    const { entryId, confirmation } = body;

    if (!entryId) {
      return validationError('Entry ID is required');
    }

    if (!confirmation) {
      return validationError('Confirmation is required');
    }

    // Revert the change
    const revertEntry = await AuditService.revertChange(entryId, session.user.id);

    return successResponse({
      success: true,
      newEntry: revertEntry,
      message: 'Change reverted successfully',
    });
  } catch (error: any) {
    if (error.code === 'AUDIT_UNAUTHORIZED') {
      return insufficientPermissionsError(error.message);
    }
    if (error.code === 'AUDIT_ENTRY_NOT_FOUND') {
      return validationError('Audit entry not found');
    }
    if (error.code === 'AUDIT_REVERT_FAILED') {
      return validationError(error.message);
    }
    return handleApiError(error);
  }
}
