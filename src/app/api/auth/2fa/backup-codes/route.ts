import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import {
  regenerateBackupCodes,
  getRemainingBackupCodes,
} from '@/services/two-factor';
import { logSecurityEvent } from '@/services/security-audit';

/**
 * GET /api/auth/2fa/backup-codes
 * Get remaining backup codes count
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

    const remaining = await getRemainingBackupCodes(session.user.id);

    return NextResponse.json({
      success: true,
      data: { remaining },
    });
  } catch (error) {
    console.error('[2FA Backup Codes] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get backup codes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/2fa/backup-codes
 * Regenerate backup codes
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const backupCodes = await regenerateBackupCodes(session.user.id);

    // Log security event
    await logSecurityEvent({
      userId: session.user.id,
      event: '2FA_VERIFIED',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: true,
      metadata: {
        action: 'backup_codes_regenerated',
      },
    });

    return NextResponse.json({
      success: true,
      data: { backupCodes },
    });
  } catch (error) {
    console.error('[2FA Regenerate Backup Codes] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to regenerate backup codes' },
      { status: 500 }
    );
  }
}
