'use client'

import { formatDistanceToNow } from 'date-fns'
import { parseUserAgent, formatUserAgent, getDeviceIcon } from '@/utils/user-agent'
import { Button } from '@/components/ui/button'

export interface UserSession {
  id: string
  device?: string
  browser?: string
  os?: string
  ipAddress?: string
  location?: string
  lastActive: Date
  isCurrent: boolean
  userAgent?: string
}

interface SessionCardProps {
  session: UserSession
  onTerminate: (sessionId: string) => Promise<void>
  isTerminating?: boolean
}

export function SessionCard({ session, onTerminate, isTerminating }: SessionCardProps) {
  // Parse user agent if available
  const parsedUA = session.userAgent
    ? parseUserAgent(session.userAgent)
    : null

  const deviceInfo = parsedUA
    ? formatUserAgent(parsedUA)
    : session.device || 'Unknown Device'

  const deviceIcon = parsedUA
    ? getDeviceIcon(parsedUA.deviceType)
    : '🖥️'

  const handleTerminate = async () => {
    if (session.isCurrent) return
    await onTerminate(session.id)
  }

  return (
    <div
      className={`border rounded-lg p-4 ${
        session.isCurrent
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Device Icon */}
          <div className="text-2xl">{deviceIcon}</div>

          {/* Session Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm truncate">{deviceInfo}</h4>
              {session.isCurrent && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                  Current
                </span>
              )}
            </div>

            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              {session.ipAddress && (
                <div className="flex items-center gap-1">
                  <span>📍</span>
                  <span>
                    {session.ipAddress}
                    {session.location && ` • ${session.location}`}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <span>🕐</span>
                <span>
                  Last active{' '}
                  {formatDistanceToNow(new Date(session.lastActive), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {!session.isCurrent && (
          <Button
            variant="secondary"
            size="small"
            onClick={handleTerminate}
            disabled={isTerminating}
            className="ml-2"
          >
            {isTerminating ? 'Signing out...' : 'Sign Out'}
          </Button>
        )}
      </div>
    </div>
  )
}
