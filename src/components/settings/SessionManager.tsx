'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { getDeviceIcon } from '@/utils/user-agent'

interface Session {
  id: string
  browser: string
  os: string
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  device: string
  ipAddress: string | null
  location: string
  lastActive: string
  createdAt: string
  isCurrent: boolean
}

interface SessionsResponse {
  sessions: Session[]
  total: number
}

export function SessionManager() {
  const t = useTranslations()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [terminatingId, setTerminatingId] = useState<string | null>(null)
  const [terminatingAll, setTerminatingAll] = useState(false)

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/sessions')
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }

      const data: SessionsResponse = await response.json()
      setSessions(data.sessions)
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setError('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  // Terminate a session
  const terminateSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to sign out this device?')) {
      return
    }

    try {
      setTerminatingId(sessionId)

      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to terminate session')
      }

      // Remove the session from the list
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    } catch (err) {
      console.error('Error terminating session:', err)
      alert(err instanceof Error ? err.message : 'Failed to terminate session')
    } finally {
      setTerminatingId(null)
    }
  }

  // Terminate all other sessions
  const terminateAllOthers = async () => {
    const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length

    if (otherSessionsCount === 0) {
      return
    }

    if (!confirm(`Are you sure you want to sign out all ${otherSessionsCount} other device${otherSessionsCount > 1 ? 's' : ''}?`)) {
      return
    }

    try {
      setTerminatingAll(true)

      const response = await fetch('/api/auth/sessions/terminate-others', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to terminate sessions')
      }

      // Keep only the current session
      setSessions((prev) => prev.filter((s) => s.isCurrent))
    } catch (err) {
      console.error('Error terminating sessions:', err)
      alert(err instanceof Error ? err.message : 'Failed to terminate sessions')
    } finally {
      setTerminatingAll(false)
    }
  }

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  // Load sessions on mount
  useEffect(() => {
    fetchSessions()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Active Sessions</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-24"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Active Sessions</h3>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={fetchSessions}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Active Sessions</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your active sessions across all devices
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sessions.filter((s) => !s.isCurrent).length > 0 && (
            <button
              onClick={terminateAllOthers}
              disabled={terminatingAll}
              className="
                px-3 py-1.5 text-sm font-medium
                text-red-600 dark:text-red-400
                hover:bg-red-50 dark:hover:bg-red-900/20
                rounded-md transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {terminatingAll ? 'Signing out...' : 'Sign out all others'}
            </button>
          )}
          <button
            onClick={fetchSessions}
            className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
          >
            Refresh
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No active sessions found
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`
                bg-white dark:bg-gray-800 border rounded-lg p-4
                ${
                  session.isCurrent
                    ? 'border-teal-500 dark:border-teal-600'
                    : 'border-gray-200 dark:border-gray-700'
                }
              `}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {/* Device Icon */}
                  <div className="text-3xl mt-1">
                    {getDeviceIcon(session.deviceType)}
                  </div>

                  {/* Session Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {session.device}
                      </h4>
                      {session.isCurrent && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400">
                          Current device
                        </span>
                      )}
                    </div>

                    <div className="mt-1 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        {session.browser} • {session.os}
                      </p>
                      {session.ipAddress && (
                        <p>
                          {session.location} • {session.ipAddress}
                        </p>
                      )}
                      <p className="text-xs">
                        Last active: {formatRelativeTime(session.lastActive)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {!session.isCurrent && (
                  <button
                    onClick={() => terminateSession(session.id)}
                    disabled={terminatingId === session.id}
                    className="
                      px-3 py-1.5 text-sm font-medium
                      text-red-600 dark:text-red-400
                      hover:bg-red-50 dark:hover:bg-red-900/20
                      rounded-md transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    {terminatingId === session.id ? 'Signing out...' : 'Sign out'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {sessions.length > 1 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            💡 Tip: If you see a session you don't recognize, sign it out immediately
            and change your password.
          </p>
        </div>
      )}
    </div>
  )
}
