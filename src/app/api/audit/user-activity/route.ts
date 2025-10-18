import { prisma } from '@/services/prisma'
import {
  successResponse,
  authRequiredError,
  insufficientPermissionsError,
  handleApiError,
} from '@/utils/api-response'
import { auth } from '@/services/auth'

/**
 * GET /api/audit/user-activity
 * Get user activity summary with top actions and recent logins
 * Requires AUDITOR role or higher
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return authRequiredError()
    }

    // Check role - AUDITOR or higher required
    const allowedRoles = ['AUDITOR', 'MANAGER', 'ADMIN']
    if (!allowedRoles.includes(session.user.role)) {
      return insufficientPermissionsError('AUDITOR role or higher required')
    }

    // Aggregate audit logs by user and action type
    // Get top actions per user (most active users)
    const topActionsRaw = await prisma.auditLog.groupBy({
      by: ['userId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10, // Top 10 most active users
    })

    // Fetch user details for top actions
    const userIds = topActionsRaw.map((item) => item.userId)
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    // Get last action timestamp for each user
    const lastActions = await Promise.all(
      userIds.map(async (userId) => {
        const lastLog = await prisma.auditLog.findFirst({
          where: { userId },
          orderBy: { timestamp: 'desc' },
          select: { timestamp: true },
        })
        return { userId, lastAction: lastLog?.timestamp }
      })
    )

    // Combine data for top actions
    const topActions = topActionsRaw.map((item) => {
      const user = users.find((u) => u.id === item.userId)
      const lastAction = lastActions.find((la) => la.userId === item.userId)
      return {
        userId: item.userId,
        userName: user?.name || 'Unknown',
        userEmail: user?.email || '',
        actionCount: item._count.id,
        lastAction: lastAction?.lastAction?.toISOString() || null,
      }
    })

    // Query recent LOGIN actions
    const recentLogins = await prisma.auditLog.findMany({
      where: {
        action: 'LOGIN',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 20, // Last 20 logins
    })

    // Format recent logins
    const formattedRecentLogins = recentLogins.map((log) => ({
      userId: log.userId,
      userName: log.user.name,
      userEmail: log.user.email,
      timestamp: log.timestamp.toISOString(),
      ipAddress: log.ipAddress || 'unknown',
    }))

    return successResponse({
      topActions,
      recentLogins: formattedRecentLogins,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
