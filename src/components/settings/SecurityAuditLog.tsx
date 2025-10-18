'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/Pagination'

export interface SecurityEvent {
  id: string
  type: 'login' | 'failed_login' | 'password_change' | 'session_terminated'
  timestamp: Date
  ipAddress: string
  location?: string
  success: boolean
  userAgent?: string
}

interface SecurityAuditLogProps {
  userId: string
  events: SecurityEvent[]
  totalEvents: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onExport: () => Promise<void>
  isLoading?: boolean
}

export function SecurityAuditLog({
  userId,
  events,
  totalEvents,
  currentPage,
  pageSize,
  onPageChange,
  onExport,
  isLoading,
}: SecurityAuditLogProps) {
  const t = useTranslations('settings.security')
  const [isExporting, setIsExporting] = useState(false)

  const totalPages = Math.ceil(totalEvents / pageSize)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await onExport()
    } finally {
      setIsExporting(false)
    }
  }

  const getEventIcon = (type: SecurityEvent['type'], success: boolean) => {
    if (!success) return '❌'
    
    switch (type) {
      case 'login':
        return '✅'
      case 'failed_login':
        return '⚠️'
      case 'password_change':
        return '🔑'
      case 'session_terminated':
        return '🚪'
      default:
        return '📝'
    }
  }

  const getEventLabel = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login':
        return 'Successful Login'
      case 'failed_login':
        return 'Failed Login Attempt'
      case 'password_change':
        return 'Password Changed'
      case 'session_terminated':
        return 'Session Terminated'
      default:
        return 'Security Event'
    }
  }

  const getEventColor = (type: SecurityEvent['type'], success: boolean) => {
    if (!success) return 'text-red-600 dark:text-red-400'
    
    switch (type) {
      case 'login':
        return 'text-green-600 dark:text-green-400'
      case 'failed_login':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'password_change':
        return 'text-blue-600 dark:text-blue-400'
      case 'session_terminated':
        return 'text-gray-600 dark:text-gray-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('auditLog')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            View your recent security activity
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleExport}
          disabled={isExporting || events.length === 0}
        >
          {isExporting ? 'Exporting...' : 'Export Log'}
        </Button>
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="text-xl">
                  {getEventIcon(event.type, event.success)}
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4
                      className={`font-semibold text-sm ${getEventColor(
                        event.type,
                        event.success
                      )}`}
                    >
                      {getEventLabel(event.type)}
                    </h4>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-4">
                      <span>
                        🕐{' '}
                        {format(
                          new Date(event.timestamp),
                          'MMM dd, yyyy • hh:mm a'
                        )}
                      </span>
                      {event.ipAddress && (
                        <span>
                          📍 {event.ipAddress}
                          {event.location && ` • ${event.location}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No security events found</p>
          <p className="text-sm mt-1">
            Your security activity will appear here
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalEvents}
            itemsPerPage={pageSize}
            onPageChange={onPageChange}
            onItemsPerPageChange={() => {}}
            showItemsPerPage={false}
            showJumpToPage={false}
          />
        </div>
      )}
    </div>
  )
}
