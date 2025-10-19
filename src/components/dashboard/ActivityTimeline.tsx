'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from '@/hooks/useTranslations'
import { useLocale } from '@/hooks/useLocale'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ActivityItem {
  id: string
  itemName: string
  quantity: number
  destination: string
  enteredBy: string
  createdAt: string
}

interface ActivityTimelineProps {
  activities: ActivityItem[]
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const t = useTranslations()
  const router = useRouter()
  const locale = useLocale()

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return t('dashboard.justNow')
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return t('dashboard.minutesAgo', { count: minutes })
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return t('dashboard.hoursAgo', { count: hours })
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return t('dashboard.daysAgo', { count: days })
    }
  }

  const getDestinationColor = (destination: string) => {
    return destination === 'MAIS'
      ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
      : 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-400'
  }

  const handleViewAll = () => {
    router.push(`/data-log`)
  }

  return (
    <Card>
      <Card.Header className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('dashboard.recentActivity')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('dashboard.last10Entries')}
          </p>
        </div>
        <Button
          variant="secondary"
          size="small"
          onClick={handleViewAll}
        >
          {t('dashboard.viewAll')}
        </Button>
      </Card.Header>
      <Card.Body>
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              {t('dashboard.noRecentActivity')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0"
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary-500 dark:bg-primary-400 mt-1.5" />
                  {index < activities.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2" />
                  )}
                </div>

                {/* Activity content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {activity.itemName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getDestinationColor(activity.destination)}`}>
                          {activity.destination}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t('common.quantity')}: {activity.quantity.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('dashboard.addedBy')} {activity.enteredBy}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatTimeAgo(activity.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  )
}
