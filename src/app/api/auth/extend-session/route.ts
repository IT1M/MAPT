import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'

/**
 * POST /api/auth/extend-session
 * Extend session duration when "Remember Me" is checked
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

    const body = await request.json()
    const { rememberMe } = body

    // Get session token from cookies
    const sessionToken = request.cookies.get('authjs.session-token')?.value ||
                        request.cookies.get('__Secure-authjs.session-token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session token found' },
        { status: 400 }
      )
    }

    // Calculate new expiration date
    const expirationDays = rememberMe ? 30 : 1 // 30 days or 24 hours
    const newExpiration = new Date()
    newExpiration.setDate(newExpiration.getDate() + expirationDays)

    // Update session expiration in database
    await prisma.session.updateMany({
      where: {
        sessionToken,
        userId: session.user.id,
      },
      data: {
        expires: newExpiration,
      },
    })

    console.log(`[Session] Extended session for user ${session.user.id} to ${newExpiration.toISOString()}`)

    return NextResponse.json({
      success: true,
      expiresAt: newExpiration,
      duration: rememberMe ? '30 days' : '24 hours',
    })
  } catch (error) {
    console.error('Error extending session:', error)
    return NextResponse.json(
      { error: 'Failed to extend session' },
      { status: 500 }
    )
  }
}
