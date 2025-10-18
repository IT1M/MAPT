import { NextRequest, NextResponse } from 'next/server'
import { getLoginSecurityStatus } from '@/services/login-security'

/**
 * GET /api/auth/security-status
 * Check login security status for an email address
 * Returns whether CAPTCHA is required or account is locked
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Email address is required',
          },
        },
        { status: 400 }
      )
    }

    const status = await getLoginSecurityStatus(email)

    return NextResponse.json({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error('[SecurityStatus] Error checking security status:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check security status',
        },
      },
      { status: 500 }
    )
  }
}
