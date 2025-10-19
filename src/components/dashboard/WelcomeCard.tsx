'use client'

import { Card } from '@/components/ui/card'
import { useTranslations } from '@/hooks/useTranslations'

interface WelcomeCardProps {
  userName: string
  userRole: string
  todayCount: number
  weekCount: number
  monthCount: number
}

export function WelcomeCard({ userName, userRole, todayCount, weekCount, monthCount }: WelcomeCardProps) {
  const t = useTranslations()
  
  // Get current date and time
  const now = new Date()
  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  const timeOptions: Intl.DateTimeFormatOptions = { 
    hour: '2-digit', 
    minute: '2-digit' 
  }
  
  const currentDate = now.toLocaleDateString(undefined, dateOptions)
  const currentTime = now.toLocaleTimeString(undefined, timeOptions)
  
  // Get greeting based on time of day
  const hour = now.getHours()
  let greeting = t('dashboard.goodMorning')
  if (hour >= 12 && hour < 17) {
    greeting = t('dashboard.goodAfternoon')
  } else if (hour >= 17) {
    greeting = t('dashboard.goodEvening')
  }

  return (
    <Card className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white shadow-lg">
      <Card.Body className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Welcome Section */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {greeting}, {userName}!
            </h1>
            <p className="text-primary-50 text-lg mb-1">
              {userRole}
            </p>
            <div className="flex items-center gap-4 text-primary-100 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{currentDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{currentTime}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4">
            {/* Today */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[100px]">
              <div className="text-primary-100 text-xs uppercase tracking-wide mb-1">
                {t('dashboard.today')}
              </div>
              <div className="text-3xl font-bold">{todayCount}</div>
              <div className="text-primary-100 text-xs mt-1">
                {t('common.entries')}
              </div>
            </div>

            {/* This Week */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[100px]">
              <div className="text-primary-100 text-xs uppercase tracking-wide mb-1">
                {t('dashboard.thisWeek')}
              </div>
              <div className="text-3xl font-bold">{weekCount}</div>
              <div className="text-primary-100 text-xs mt-1">
                {t('common.entries')}
              </div>
            </div>

            {/* This Month */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[100px]">
              <div className="text-primary-100 text-xs uppercase tracking-wide mb-1">
                {t('dashboard.thisMonth')}
              </div>
              <div className="text-3xl font-bold">{monthCount}</div>
              <div className="text-primary-100 text-xs mt-1">
                {t('common.entries')}
              </div>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}
