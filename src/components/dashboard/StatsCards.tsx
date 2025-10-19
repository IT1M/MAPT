'use client'

import { Card } from '@/components/ui/card'
import { useTranslations } from '@/hooks/useTranslations'

interface StatsCardsProps {
  totalItems: number
  rejectRate: number
  activeUsers: number
  maisPercentage: number
  fozanPercentage: number
  trendData?: number[] // Last 7 days data for sparkline
}

export function StatsCards({
  totalItems,
  rejectRate,
  activeUsers,
  maisPercentage,
  fozanPercentage,
  trendData = []
}: StatsCardsProps) {
  const t = useTranslations()

  // Simple sparkline component
  const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
    if (data.length === 0) return null

    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 100
      return `${x},${y}`
    }).join(' ')

    return (
      <svg className="w-full h-12" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    )
  }

  const stats = [
    {
      id: 'total-items',
      title: t('dashboard.stats.totalItems'),
      value: totalItems.toLocaleString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900/30',
      showSparkline: true
    },
    {
      id: 'reject-rate',
      title: t('dashboard.stats.avgRejectRate'),
      value: `${rejectRate.toFixed(1)}%`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: rejectRate > 10 ? 'text-danger-600 dark:text-danger-400' : 'text-yellow-600 dark:text-yellow-400',
      bgColor: rejectRate > 10 ? 'bg-danger-100 dark:bg-danger-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30',
      showSparkline: false
    },
    {
      id: 'active-users',
      title: t('dashboard.stats.activeUsers'),
      value: activeUsers.toString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'text-accent-600 dark:text-accent-400',
      bgColor: 'bg-accent-100 dark:bg-accent-900/30',
      showSparkline: false
    }
  ]

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.id} hover>
            <Card.Body className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.bgColor} ${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  {stat.icon}
                </div>
              </div>
              {stat.showSparkline && trendData.length > 0 && (
                <div className="mt-4">
                  <Sparkline data={trendData} color="currentColor" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {t('dashboard.stats.last7Days')}
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Destination Distribution */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('dashboard.stats.destinationDistribution')}
          </h3>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            {/* MAIS */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  MAIS
                </span>
                <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                  {maisPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-primary-500 dark:bg-primary-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${maisPercentage}%` }}
                />
              </div>
            </div>

            {/* FOZAN */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  FOZAN
                </span>
                <span className="text-sm font-bold text-accent-600 dark:text-accent-400">
                  {fozanPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-accent-500 dark:bg-accent-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${fozanPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}
