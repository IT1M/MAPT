'use client'

import { Notification } from '@/context/NotificationContext'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onRemove: (id: string) => void
  onClose?: () => void
}

export function NotificationItem({ notification, onMarkAsRead, onRemove, onClose }: NotificationItemProps) {
  const router = useRouter()
  const locale = useLocale()

  const getTypeIcon = () => {
    switch (notification.type) {
      case 'SYSTEM':
        return (
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'ACTIVITY':
        return (
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'APPROVAL':
        return (
          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )
      case 'ALERT':
        return (
          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      case 'MENTION':
        return (
          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getPriorityBadge = () => {
    if (notification.priority === 'URGENT') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          Urgent
        </span>
      )
    }
    if (notification.priority === 'HIGH') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
          High
        </span>
      )
    }
    return null
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return locale === 'ar' ? 'الآن' : 'Just now'
    if (minutes < 60) return locale === 'ar' ? `منذ ${minutes} دقيقة` : `${minutes}m ago`
    if (hours < 24) return locale === 'ar' ? `منذ ${hours} ساعة` : `${hours}h ago`
    if (days < 7) return locale === 'ar' ? `منذ ${days} يوم` : `${days}d ago`
    
    return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
    if (notification.link) {
      router.push(notification.link)
      onClose?.()
    }
  }

  return (
    <div
      className={`p-3 border-b border-gray-200 dark:border-gray-700 transition-colors ${
        !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-800'
      } hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
        notification.link ? 'cursor-pointer' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getTypeIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className={`text-sm font-medium ${
                  !notification.read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {notification.title}
                </p>
                {getPriorityBadge()}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {notification.message}
              </p>
            </div>

            {/* Remove button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove(notification.id)
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Remove notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Timestamp */}
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {formatTimestamp(notification.createdAt)}
          </p>
        </div>

        {/* Unread indicator */}
        {!notification.read && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  )
}
