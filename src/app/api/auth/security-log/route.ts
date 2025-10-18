import { NextRequest } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import {
  successResponse,
  handleApiError,
  authRequiredError,
} from '@/utils/api-response'

/**
 * GET /api/auth/security-log
 * Get security audit log for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return authRequiredError('You must be logged in to view security logs')
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const skip = (page - 1) * limit

    // Get security-related audit logs for the user
    const securityActions: ('LOGIN' | 'LOGOUT' | 'UPDATE')[] = ['LOGIN', 'LOGOUT', 'UPDATE'] // UPDATE for password changes

    const [events, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          userId: session.user.id,
          action: {
            in: securityActions,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: limit,
        skip,
      }),
      prisma.auditLog.count({
        where: {
          userId: session.user.id,
          action: {
            in: securityActions as any,
          },
        },
      }),
    ])

    // Transform audit logs to security events
    const securityEvents = events.map((event) => {
      let type: 'login' | 'failed_login' | 'password_change' | 'session_terminated' = 'login'
      let success = true

      // Determine event type based on action and entity
      if (event.action === 'LOGIN') {
        type = 'login'
        success = true
      } else if (event.action === 'LOGOUT') {
        type = 'session_terminated'
        success = true
      } else if (event.action === 'UPDATE' && event.entityType === 'User') {
        // Check if it's a password change
        const changes = event.newValue as any
        if (changes?.action === 'password_change') {
          type = 'password_change'
          success = true
        }
      }

      return {
        id: event.id,
        type,
        timestamp: event.timestamp,
        ipAddress: event.ipAddress || 'Unknown',
        location: null, // We don't store location yet
        success,
        userAgent: event.userAgent,
      }
    })

    return successResponse({
      events: securityEvents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
