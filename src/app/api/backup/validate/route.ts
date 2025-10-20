import { NextRequest } from 'next/server';
import { checkAuth, checkRole } from '@/middleware/auth';
import {
  successResponse,
  handleApiError,
  validationError,
} from '@/utils/api-response';
import { BackupService } from '@/services/backup';

/**
 * POST /api/backup/validate
 *
 * Validate backup file integrity
 *
 * Request Body:
 * - backupId: string (required)
 *
 * Requirements: 20
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth();
    if ('error' in authResult) {
      return authResult.error;
    }

    const { context } = authResult;

    // Check role (ADMIN or MANAGER)
    const isAdmin = context.user.role === 'ADMIN';
    const isManager = context.user.role === 'MANAGER';

    if (!isAdmin && !isManager) {
      const roleCheck = checkRole('MANAGER', context);
      if ('error' in roleCheck) {
        return roleCheck.error;
      }
    }

    // Parse and validate request body
    const body = await request.json();

    if (!body.backupId || typeof body.backupId !== 'string') {
      return validationError('Backup ID is required');
    }

    // Validate backup using BackupService
    const result = await BackupService.validateBackup(body.backupId);

    // Return validation result
    return successResponse(
      {
        valid: result.valid,
        checks: result.checks,
        errors: result.errors,
      },
      result.valid ? 'Backup is valid' : 'Backup validation failed'
    );
  } catch (error: any) {
    return handleApiError(error);
  }
}
