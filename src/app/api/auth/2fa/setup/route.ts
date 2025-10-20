import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { setup2FA } from '@/services/two-factor';
import { logSecurityEvent } from '@/services/security-audit';

/**
 * POST /api/auth/2fa/setup
 * Initialize 2FA setup for the current user
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

    const { secret, qrCode, backupCodes } = await setup2FA(
      session.user.id,
      session.user.email
    );

    // Log security event
    await logSecurityEvent({
      userId: session.user.id,
      event: '2FA_ENABLED',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: true,
      metadata: {
        action: 'setup_initiated',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        secret,
        qrCode,
        backupCodes,
      },
    });
  } catch (error) {
    console.error('[2FA Setup] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to setup 2FA' },
      { status: 500 }
    );
  }
}
