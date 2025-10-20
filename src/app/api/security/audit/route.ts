import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import {
  getUserSecurityLogs,
  getAllSecurityLogs,
  detectSuspiciousActivity,
} from '@/services/security-audit';

/**
 * GET /api/security/audit
 * Get security audit logs
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const userId = searchParams.get('userId');
    const detectSuspicious = searchParams.get('detectSuspicious') === 'true';

    // Admin can view all logs, users can only view their own
    const isAdmin = session.user.role === 'ADMIN';
    const targetUserId = isAdmin && userId ? userId : session.user.id;

    const { logs, total } =
      isAdmin && userId
        ? await getAllSecurityLogs({ limit, offset, userId: targetUserId })
        : await getUserSecurityLogs(targetUserId, { limit, offset });

    let suspiciousActivity = undefined;
    if (detectSuspicious) {
      suspiciousActivity = await detectSuspiciousActivity(targetUserId);
    }

    return NextResponse.json({
      success: true,
      data: {
        logs,
        total,
        suspiciousActivity,
      },
    });
  } catch (error) {
    console.error('[Security Audit] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
