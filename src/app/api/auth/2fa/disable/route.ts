import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { disable2FA, verify2FALogin } from '@/services/two-factor';
import { logSecurityEvent } from '@/services/security-audit';

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA for the current user (requires verification)
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

    const body = await req.json();
    const { token, password } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Verification code is required' },
        { status: 400 }
      );
    }

    // Verify the token before disabling
    const isValid = await verify2FALogin(session.user.id, token);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    await disable2FA(session.user.id);

    // Log security event
    await logSecurityEvent({
      userId: session.user.id,
      event: '2FA_DISABLED',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: true,
    });

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully',
    });
  } catch (error) {
    console.error('[2FA Disable] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}
