import { NextRequest } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import { parseUserAgent } from '@/utils/user-agent'
import {
  successResponse,
  handleApiError,
  authRequiredError,
} from '@/utils/api-response'

/**
 * GET /api/auth/sessions
 * Get all active sessions for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return authRequiredError('You must be logged in to view sessions')
    }

    // Get all sessions for the user
    const sessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        expires: {
          gt: new Date(), // Only active sessions
        },
      },
      orderBy: {
        expires: 'desc',
      },
    })

    // Get current session token from request
    const currentSessionToken = request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value

    // Transform sessions to include device info
    const sessionsWithInfo = sessions.map((s) => {
      const isCurrent = s.sessionToken === currentSessionToken

      return {
        id: s.id,
        isCurrent,
        lastActive: s.expires,
        // Note: We don't have device/browser/IP info in the current Session model
        // This would require extending the Session model with additional fields
        device: 'Unknown Device',
        browser: 'Unknown Browser',
        ipAddress: null,
        location: null,
        userAgent: null,
      }
    })

    return successResponse({
      sessions: sessionsWithInfo,
      currentSessionId: sessionsWithInfo.find((s) => s.isCurrent)?.id || null,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/auth/sessions
 * Delete all sessions except the current one
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return authRequiredError('You must be logged in to manage sessions')
    }

    // Get current session token
    const currentSessionToken = request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value

    if (!currentSessionToken) {
      return authRequiredError('No active session found')
    }

    // Delete all sessions except the current one
    const result = await prisma.session.deleteMany({
      where: {
        userId: session.user.id,
        sessionToken: {
          not: currentSessionToken,
        },
      },
    })

    return successResponse(
      {
        deletedCount: result.count,
      },
      `Successfully signed out of ${result.count} other session(s)`
    )
  } catch (error) {
    return handleApiError(error)
  }
}
