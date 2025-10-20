import { NextRequest } from 'next/server';
import { checkAuth, checkRole } from '@/middleware/auth';
import { successResponse, handleApiError } from '@/utils/api-response';
import { BackupService } from '@/services/backup';

/**
 * GET /api/backup/health
 *
 * Get backup system health metrics
 *
 * Requirements: 19
 */
export async function GET(request: NextRequest) {
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

    // Get health metrics using BackupService
    const health = await BackupService.getHealthMetrics();

    // Return health metrics
    return successResponse({
      lastBackup: health.lastBackup?.toISOString() || null,
      nextBackup: health.nextBackup?.toISOString() || null,
      backupStreak: health.backupStreak,
      failedBackupsLast30Days: health.failedBackupsLast30Days,
      avgDuration: health.avgDuration,
      storageUsed: health.storageUsed,
      storageTotal: health.storageTotal,
      storageUsedPercent: Math.round(
        (health.storageUsed / health.storageTotal) * 100
      ),
      alerts: health.alerts,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
