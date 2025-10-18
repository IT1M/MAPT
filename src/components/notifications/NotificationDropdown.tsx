'use client'

import { useNotifications } from '@/context/NotificationContext'
import { NotificationItem } from './NotificationItem'
import { useTranslations } from 'next-intl'

interface NotificationDropdownProps {
  onClose: () => void
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications()
  const t = useTranslations()

  // Show only the most recent 10 notifications in dropdown
  const recentNotifications = notifications.slice(0, 10)

  return (
    <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50 animate-fade-in">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t('notifications.title')}
            {unreadCount > 0 && (
              <span className="ml-2 rtl:ml-0 rtl:mr-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                ({unreadCount} {t('notifications.unread')})
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                {t('notifications.markAllRead')}
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {t('notifications.clearAll')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[400px] overflow-y-auto">
        {recentNotifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('notifications.empty.title')}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('notifications.empty.description')}
            </p>
          </div>
        ) : (
          <>
            {recentNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onRemove={removeNotification}
              />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 10 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-center">
          <button
            onClick={onClose}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            {t('notifications.viewAll')} ({notifications.length})
          </button>
        </div>
      )}
    </div>
  )
}
