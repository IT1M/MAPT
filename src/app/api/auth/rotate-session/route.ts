import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { rotateSessionToken } from '@/services/session'

/**
 * POST /api/auth/rotate-session
 * Rotate session token for enhanced security
 * Should be called after sensitive operations like password change
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current session token from cookies
    const currentSessionToken = request.cookies.get('authjs.session-token')?.value ||
                                request.cookies.get('__Secure-authjs.session-token')?.value

    if (!currentSessionToken) {
      return NextResponse.json(
        { error: 'No session token found' },
        { status: 400 }
      )
    }

    // Rotate the session token
    const newSessionToken = await rotateSessionToken(currentSessionToken, session.user.id)

    if (!newSessionToken) {
      return NextResponse.json(
        { error: 'Failed to rotate session token' },
        { status: 500 }
      )
    }

    // Set new session token in cookie
    const response = NextResponse.json({
      success: true,
      message: 'Session token rotated successfully',
    })

    const cookieName = process.env.NODE_ENV === 'production'
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token'

    response.cookies.set(cookieName, newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    })

    return response
  } catch (error) {
    console.error('Error rotating session:', error)
    return NextResponse.json(
      { error: 'Failed to rotate session' },
      { status: 500 }
    )
  }
}
