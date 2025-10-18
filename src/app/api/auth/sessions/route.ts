import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import { parseUserAgent } from '@/utils/user-agent'

/**
 * GET /api/auth/sessions
 * Get all active sessions for the current user
 */
export async function GET(request: NextRequest) {
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

    // Fetch all active sessions for the user
    const sessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        expires: {
          gt: new Date(), // Only active sessions
        },
      },
      orderBy: {
        lastActive: 'desc',
      },
    })

    // Parse user agent for each session and mark current session
    const sessionsWithDetails = sessions.map((s) => {
      const parsed = parseUserAgent(s.userAgent || '')
      const isCurrent = s.sessionToken === currentSessionToken

      return {
        id: s.id,
        browser: s.browser || parsed.browser,
        os: s.os || parsed.os,
        deviceType: s.deviceType || parsed.deviceType,
        device: parsed.device,
        ipAddress: s.ipAddress,
        location: s.location || 'Unknown',
        lastActive: s.lastActive,
        createdAt: s.createdAt,
        isCurrent,
      }
    })

    return NextResponse.json({
      sessions: sessionsWithDetails,
      total: sessionsWithDetails.length,
    })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
