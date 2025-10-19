'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { PasswordChangeForm, PasswordChangeData } from './PasswordChangeForm'
import { SessionManager } from './SessionManager'
import { SecurityAuditLog, SecurityEvent } from './SecurityAuditLog'
import { UserSession } from './SessionCard'

interface SecuritySettingsProps {
  userId: string
  sessions: UserSession[]
  currentSessionId: string
  securityEvents: SecurityEvent[]
  totalEvents: number
  currentPage: number
  pageSize: number
  onPasswordChange: (data: PasswordChangeData) => Promise<void>
  onSessionTerminate: (sessionId: string) => Promise<void>
  onSessionTerminateAll: () => Promise<void>
  onSessionsRefresh: () => Promise<void>
  onPageChange: (page: number) => void
  onExportLog: () => Promise<void>
}

export function SecuritySettings({
  userId,
  sessions,
  currentSessionId,
  securityEvents,
  totalEvents,
  currentPage,
  pageSize,
  onPasswordChange,
  onSessionTerminate,
  onSessionTerminateAll,
  onSessionsRefresh,
  onPageChange,
  onExportLog,
}: SecuritySettingsProps) {
  const t = useTranslations('settings.security')

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold">{t('title')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your password, sessions, and security settings
        </p>
      </div>

      {/* Password Change Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">{t('changePassword')}</h3>
        <PasswordChangeForm onSubmit={onPasswordChange} />
      </section>

      {/* Session Management Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <SessionManager
          sessions={sessions}
          currentSessionId={currentSessionId}
          onTerminate={onSessionTerminate}
          onTerminateAll={onSessionTerminateAll}
          onRefresh={onSessionsRefresh}
        />
      </section>

      {/* Security Audit Log Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <SecurityAuditLog
          userId={userId}
          events={securityEvents}
          totalEvents={totalEvents}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onExport={onExportLog}
        />
      </section>
    </div>
  )
}
