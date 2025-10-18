'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { SessionCard, UserSession } from './SessionCard'
import { Button } from '@/components/ui/button'

interface SessionManagerProps {
  sessions: UserSession[]
  currentSessionId: string
  onTerminate: (sessionId: string) => Promise<void>
  onTerminateAll: () => Promise<void>
  onRefresh?: () => Promise<void>
}

export function SessionManager({
  sessions,
  currentSessionId,
  onTerminate,
  onTerminateAll,
  onRefresh,
}: SessionManagerProps) {
  const t = useTranslations('settings.security')
  const [terminatingIds, setTerminatingIds] = useState<Set<string>>(new Set())
  const [isTerminatingAll, setIsTerminatingAll] = useState(false)

  const otherSessions = sessions.filter((s) => !s.isCurrent)
  const currentSession = sessions.find((s) => s.isCurrent)

  const handleTerminate = async (sessionId: string) => {
    setTerminatingIds((prev) => new Set(prev).add(sessionId))
    try {
      await onTerminate(sessionId)
      if (onRefresh) {
        await onRefresh()
      }
    } finally {
      setTerminatingIds((prev) => {
        const next = new Set(prev)
        next.delete(sessionId)
        return next
      })
    }
  }

  const handleTerminateAll = async () => {
    if (otherSessions.length === 0) return

    const confirmed = window.confirm(
      `Are you sure you want to sign out of all other sessions? This will sign you out of ${otherSessions.length} device(s).`
    )

    if (!confirmed) return

    setIsTerminatingAll(true)
    try {
      await onTerminateAll()
      if (onRefresh) {
        await onRefresh()
      }
    } finally {
      setIsTerminatingAll(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('sessions')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your active sessions across devices
          </p>
        </div>
        {otherSessions.length > 0 && (
          <Button
            variant="secondary"
            onClick={handleTerminateAll}
            disabled={isTerminatingAll}
          >
            {isTerminatingAll
              ? 'Signing out...'
              : `Sign Out All Other Sessions (${otherSessions.length})`}
          </Button>
        )}
      </div>

      {/* Current Session */}
      {currentSession && (
        <div>
          <h4 className="text-sm font-medium mb-3">Current Session</h4>
          <SessionCard
            session={currentSession}
            onTerminate={handleTerminate}
            isTerminating={terminatingIds.has(currentSession.id)}
          />
        </div>
      )}

      {/* Other Sessions */}
      {otherSessions.length > 0 ? (
        <div>
          <h4 className="text-sm font-medium mb-3">
            Other Sessions ({otherSessions.length})
          </h4>
          <div className="space-y-3">
            {otherSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onTerminate={handleTerminate}
                isTerminating={terminatingIds.has(session.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No other active sessions</p>
          <p className="text-sm mt-1">
            You are only signed in on this device
          </p>
        </div>
      )}
    </div>
  )
}
