import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { verify2FASetup } from '@/services/two-factor'
import { logSecurityEvent } from '@/services/security-audit'

/**
 * POST /api/auth/2fa/verify
 * Verify TOTP code and enable 2FA
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    const isValid = await verify2FASetup(session.user.id, token)

    if (!isValid) {
      await logSecurityEvent({
        userId: session.user.id,
        event: '2FA_FAILED',
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        success: false,
        metadata: {
          action: 'setup_verification'
        }
      })

      return NextResponse.json(
        { success: false, error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Log successful verification
    await logSecurityEvent({
      userId: session.user.id,
      event: '2FA_VERIFIED',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: true,
      metadata: {
        action: 'setup_completed'
      }
    })

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully'
    })
  } catch (error) {
    console.error('[2FA Verify] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify 2FA code' },
      { status: 500 }
    )
  }
}
