import { prisma } from './prisma'
import { ActionType } from '@prisma/client'

/**
 * Security Audit Logging Service
 * Tracks security-related events for compliance and investigation
 */

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | '2FA_ENABLED'
  | '2FA_DISABLED'
  | '2FA_VERIFIED'
  | '2FA_FAILED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'SESSION_CREATED'
  | 'SESSION_TERMINATED'
  | 'PERMISSION_CHANGED'
  | 'ROLE_CHANGED'
  | 'SENSITIVE_DATA_ACCESSED'
  | 'EXPORT_DATA'
  | 'BULK_DELETE'
  | 'SETTINGS_CHANGED'
  | 'USER_CREATED'
  | 'USER_DELETED'
  | 'SUSPICIOUS_ACTIVITY'

export interface SecurityAuditEvent {
  userId: string
  event: SecurityEventType
  ipAddress: string
  userAgent: string
  sessionId?: string
  metadata?: Record<string, any>
  success?: boolean
  errorMessage?: string
}

/**
 * Log security event
 */
export async function logSecurityEvent(event: SecurityAuditEvent): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: event.userId,
        event: event.event,
        metadata: {
          ...event.metadata,
          success: event.success,
          errorMessage: event.errorMessage
        },
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        sessionId: event.sessionId || 'unknown',
        timestamp: new Date()
      }
    })

    console.log(`[SecurityAudit] ${event.event} - User: ${event.userId}, IP: ${event.ipAddress}`)
  } catch (error) {
    console.error('[SecurityAudit] Error logging security event:', error)
  }
}

/**
 * Get security audit logs for a user
 */
export async function getUserSecurityLogs(
  userId: string,
  options: {
    limit?: number
    offset?: number
    startDate?: Date
    endDate?: Date
    eventTypes?: SecurityEventType[]
  } = {}
): Promise<{
  logs: any[]
  total: number
}> {
  const where: any = {
    userId,
    event: {
      in: options.eventTypes || [
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        'PASSWORD_CHANGED',
        '2FA_ENABLED',
        '2FA_DISABLED',
        'ACCOUNT_LOCKED',
        'PERMISSION_CHANGED'
      ]
    }
  }

  if (options.startDate || options.endDate) {
    where.timestamp = {}
    if (options.startDate) {
      where.timestamp.gte = options.startDate
    }
    if (options.endDate) {
      where.timestamp.lte = options.endDate
    }
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc'
      },
      take: options.limit || 50,
      skip: options.offset || 0,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    }),
    prisma.activityLog.count({ where })
  ])

  return { logs, total }
}

/**
 * Get all security audit logs (admin only)
 */
export async function getAllSecurityLogs(
  options: {
    limit?: number
    offset?: number
    startDate?: Date
    endDate?: Date
    eventTypes?: SecurityEventType[]
    userId?: string
  } = {}
): Promise<{
  logs: any[]
  total: number
}> {
  const where: any = {
    event: {
      in: options.eventTypes || [
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        'PASSWORD_CHANGED',
        '2FA_ENABLED',
        '2FA_DISABLED',
        'ACCOUNT_LOCKED',
        'PERMISSION_CHANGED',
        'ROLE_CHANGED',
        'SENSITIVE_DATA_ACCESSED'
      ]
    }
  }

  if (options.userId) {
    where.userId = options.userId
  }

  if (options.startDate || options.endDate) {
    where.timestamp = {}
    if (options.startDate) {
      where.timestamp.gte = options.startDate
    }
    if (options.endDate) {
      where.timestamp.lte = options.endDate
    }
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc'
      },
      take: options.limit || 100,
      skip: options.offset || 0,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    }),
    prisma.activityLog.count({ where })
  ])

  return { logs, total }
}

/**
 * Detect suspicious activity patterns
 */
export async function detectSuspiciousActivity(
  userId: string,
  timeWindowHours: number = 24
): Promise<{
  suspicious: boolean
  reasons: string[]
  severity: 'low' | 'medium' | 'high'
}> {
  const startDate = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000)

  const logs = await prisma.activityLog.findMany({
    where: {
      userId,
      timestamp: {
        gte: startDate
      }
    },
    orderBy: {
      timestamp: 'desc'
    }
  })

  const reasons: string[] = []
  let severity: 'low' | 'medium' | 'high' = 'low'

  // Check for multiple failed logins
  const failedLogins = logs.filter((log: any) => log.event === 'LOGIN_FAILED')
  if (failedLogins.length >= 5) {
    reasons.push(`${failedLogins.length} failed login attempts in ${timeWindowHours} hours`)
    severity = 'high'
  } else if (failedLogins.length >= 3) {
    reasons.push(`${failedLogins.length} failed login attempts in ${timeWindowHours} hours`)
    severity = 'medium'
  }

  // Check for logins from multiple IPs
  const uniqueIPs = new Set(logs.map((log: any) => log.ipAddress))
  if (uniqueIPs.size >= 5) {
    reasons.push(`Logins from ${uniqueIPs.size} different IP addresses`)
    severity = severity === 'high' ? 'high' : 'medium'
  }

  // Check for rapid session creation
  const sessionCreations = logs.filter((log: any) => log.event === 'SESSION_CREATED')
  if (sessionCreations.length >= 10) {
    reasons.push(`${sessionCreations.length} sessions created in ${timeWindowHours} hours`)
    severity = 'high'
  }

  // Check for multiple 2FA failures
  const twoFAFailures = logs.filter((log: any) => log.event === '2FA_FAILED')
  if (twoFAFailures.length >= 3) {
    reasons.push(`${twoFAFailures.length} 2FA verification failures`)
    severity = 'high'
  }

  // Check for unusual activity hours (e.g., 2 AM - 5 AM)
  const nightActivity = logs.filter((log: any) => {
    const hour = log.timestamp.getHours()
    return hour >= 2 && hour <= 5
  })
  if (nightActivity.length >= 5) {
    reasons.push('Unusual activity during night hours (2 AM - 5 AM)')
    severity = severity === 'high' ? 'high' : 'medium'
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
    severity
  }
}

/**
 * Get security event timeline
 */
export async function getSecurityTimeline(
  userId: string,
  days: number = 30
): Promise<{
  date: string
  events: {
    type: SecurityEventType
    count: number
  }[]
}[]> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const logs = await prisma.activityLog.findMany({
    where: {
      userId,
      timestamp: {
        gte: startDate
      }
    },
    orderBy: {
      timestamp: 'asc'
    }
  })

  // Group by date
  const timeline = new Map<string, Map<string, number>>()

  logs.forEach((log: any) => {
    const date = log.timestamp.toISOString().split('T')[0]

    if (!timeline.has(date)) {
      timeline.set(date, new Map())
    }

    const dateEvents = timeline.get(date)!
    const currentCount = dateEvents.get(log.event) || 0
    dateEvents.set(log.event, currentCount + 1)
  })

  // Convert to array format
  return Array.from(timeline.entries()).map(([date, events]) => ({
    date,
    events: Array.from(events.entries()).map(([type, count]) => ({
      type: type as SecurityEventType,
      count
    }))
  }))
}

/**
 * Get security statistics
 */
export async function getSecurityStatistics(
  startDate: Date,
  endDate: Date
): Promise<{
  totalEvents: number
  eventsByType: Record<string, number>
  uniqueUsers: number
  failedLogins: number
  successfulLogins: number
  accountLockouts: number
  twoFAEnabled: number
  suspiciousActivities: number
}> {
  const logs = await prisma.activityLog.findMany({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  const eventsByType: Record<string, number> = {}
  const uniqueUsers = new Set<string>()

  let failedLogins = 0
  let successfulLogins = 0
  let accountLockouts = 0
  let twoFAEnabled = 0

  logs.forEach((log: any) => {
    uniqueUsers.add(log.userId)
    eventsByType[log.event] = (eventsByType[log.event] || 0) + 1

    if (log.event === 'LOGIN_FAILED') failedLogins++
    if (log.event === 'LOGIN_SUCCESS') successfulLogins++
    if (log.event === 'ACCOUNT_LOCKED') accountLockouts++
    if (log.event === '2FA_ENABLED') twoFAEnabled++
  })

  return {
    totalEvents: logs.length,
    eventsByType,
    uniqueUsers: uniqueUsers.size,
    failedLogins,
    successfulLogins,
    accountLockouts,
    twoFAEnabled,
    suspiciousActivities: 0 // Would need to implement detection logic
  }
}

/**
 * Export security audit logs
 */
export async function exportSecurityLogs(
  options: {
    startDate: Date
    endDate: Date
    userId?: string
    format: 'json' | 'csv'
  }
): Promise<string> {
  const { logs } = await getAllSecurityLogs({
    startDate: options.startDate,
    endDate: options.endDate,
    userId: options.userId,
    limit: 10000
  })

  if (options.format === 'json') {
    return JSON.stringify(logs, null, 2)
  }

  // CSV format
  const headers = ['Timestamp', 'User', 'Email', 'Event', 'IP Address', 'User Agent', 'Metadata']
  const rows = logs.map(log => [
    log.timestamp.toISOString(),
    log.users.name,
    log.users.email,
    log.event,
    log.ipAddress,
    log.userAgent,
    JSON.stringify(log.metadata)
  ])

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
}
