import { NextRequest } from 'next/server';
import { prisma } from '@/services/prisma';
import { checkAuth, checkRole } from '@/middleware/auth';
import { successResponse, handleApiError } from '@/utils/api-response';
import { DatabaseInfo } from '@/types/settings';

/**
 * GET /api/settings/database/status
 *
 * Get database connection status and health information
 *
 * Requirements: 24.2, 24.3, 24.4
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth();
    if ('error' in authResult) {
      return authResult.error;
    }

    const { context } = authResult;

    // Check user role (ADMIN only)
    const roleCheck = checkRole('ADMIN', context);
    if ('error' in roleCheck) {
      return roleCheck.error;
    }

    // Test database connection
    let connected = false;
    let databaseSize = 'Unknown';

    try {
      // Simple query to test connection
      await prisma.$queryRaw`SELECT 1`;
      connected = true;

      // Get database size (PostgreSQL specific)
      try {
        const sizeResult = await prisma.$queryRaw<Array<{ size: string }>>`
          SELECT pg_size_pretty(pg_database_size(current_database())) as size
        `;
        if (sizeResult && sizeResult.length > 0) {
          databaseSize = sizeResult[0].size;
        }
      } catch (error) {
        console.log('[Database Status] Could not get database size:', error);
      }
    } catch (error) {
      console.error('[Database Status] Connection test failed:', error);
      connected = false;
    }

    // Get last migration timestamp
    let lastMigration: Date | undefined = undefined;
    try {
      // Check if _prisma_migrations table exists and get the last migration
      const migrations = await prisma.$queryRaw<Array<{ finished_at: Date }>>`
        SELECT finished_at 
        FROM _prisma_migrations 
        WHERE finished_at IS NOT NULL 
        ORDER BY finished_at DESC 
        LIMIT 1
      `;
      if (migrations && migrations.length > 0) {
        lastMigration = migrations[0].finished_at;
      }
    } catch (error) {
      console.log('[Database Status] Could not get migration info:', error);
    }

    // Get last backup information
    let lastBackup: Date | undefined = undefined;
    let backupStatus: 'success' | 'failed' | 'pending' = 'pending';

    try {
      const latestBackup = await prisma.backup.findFirst({
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          createdAt: true,
          status: true,
        },
      });

      if (latestBackup) {
        lastBackup = latestBackup.createdAt;

        // Map BackupStatus enum to our status type
        switch (latestBackup.status) {
          case 'COMPLETED':
            backupStatus = 'success';
            break;
          case 'FAILED':
            backupStatus = 'failed';
            break;
          case 'IN_PROGRESS':
            backupStatus = 'pending';
            break;
          default:
            backupStatus = 'pending';
        }
      }
    } catch (error) {
      console.log('[Database Status] Could not get backup info:', error);
    }

    // Determine database type from connection string
    const databaseUrl = process.env.DATABASE_URL || '';
    let databaseType = 'Unknown';

    if (
      databaseUrl.startsWith('postgresql://') ||
      databaseUrl.startsWith('postgres://')
    ) {
      databaseType = 'PostgreSQL';
    } else if (databaseUrl.startsWith('mysql://')) {
      databaseType = 'MySQL';
    } else if (databaseUrl.startsWith('mongodb://')) {
      databaseType = 'MongoDB';
    } else if (databaseUrl.includes('sqlite')) {
      databaseType = 'SQLite';
    }

    const databaseInfo: DatabaseInfo = {
      type: databaseType,
      connected,
      lastMigration,
      size: databaseSize,
      lastBackup,
      backupStatus,
    };

    return successResponse(databaseInfo);
  } catch (error) {
    return handleApiError(error);
  }
}
