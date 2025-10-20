import { NextRequest } from 'next/server';
import { auth } from '@/services/auth';
import { prisma } from '@/services/prisma';
import { format } from 'date-fns';
import { handleApiError, authRequiredError } from '@/utils/api-response';

/**
 * GET /api/auth/security-log/export
 * Export security audit log as CSV
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return authRequiredError('You must be logged in to export security logs');
    }

    // Get all security-related audit logs for the user
    const securityActions: ('LOGIN' | 'LOGOUT' | 'UPDATE')[] = [
      'LOGIN',
      'LOGOUT',
      'UPDATE',
    ];

    const events = await prisma.auditLog.findMany({
      where: {
        userId: session.user.id,
        action: {
          in: securityActions as any,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Transform to security events
    const securityEvents = events.map((event) => {
      let type = 'login';

      if (event.action === 'LOGIN') {
        type = 'login';
      } else if (event.action === 'LOGOUT') {
        type = 'session_terminated';
      } else if (event.action === 'UPDATE' && event.entityType === 'User') {
        const changes = event.newValue as any;
        if (changes?.action === 'password_change') {
          type = 'password_change';
        }
      }

      return {
        timestamp: format(event.timestamp, 'yyyy-MM-dd HH:mm:ss'),
        type,
        ipAddress: event.ipAddress || 'Unknown',
        userAgent: event.userAgent || 'Unknown',
      };
    });

    // Generate CSV
    const headers = ['Timestamp', 'Event Type', 'IP Address', 'User Agent'];
    const rows = securityEvents.map((event) => [
      event.timestamp,
      event.type,
      event.ipAddress,
      event.userAgent,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    // Return CSV file
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="security-log-${format(
          new Date(),
          'yyyy-MM-dd'
        )}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
