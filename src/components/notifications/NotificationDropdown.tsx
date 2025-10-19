'use client'

import { useNotifications } from '@/context/NotificationContext'
import { NotificationItem } from './NotificationItem'
import { useTranslations } from '@/hooks/useTranslations'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface NotificationDropdownProps {
  onClose: () => void
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications()
  const t = useTranslations()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all')

  // Filter notifications based on active tab
  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications

  // Show only the most recent 20 notifications in dropdown
  const recentNotifications = filteredNotifications.slice(0, 20)

  const handleViewAll = () => {
    router.push('/notifications')
    onClose()
  }

  return (
    <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50 animate-fade-in">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
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
                title={t('notifications.markAllRead')}
              >
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'all'
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t('notifications.tabs.all')} ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'unread'
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t('notifications.tabs.unread')} ({unreadCount})
          </button>
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
              {activeTab === 'unread' 
                ? t('notifications.empty.noUnread')
                : t('notifications.empty.title')}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {activeTab === 'unread'
                ? t('notifications.empty.noUnreadDescription')
                : t('notifications.empty.description')}
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
                onClose={onClose}
              />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      {filteredNotifications.length > 20 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-center">
          <button
            onClick={handleViewAll}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            {t('notifications.viewAll')} ({filteredNotifications.length})
          </button>
        </div>
      )}
    </div>
  )
}
