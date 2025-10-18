'use client'

import { UserRole } from '@prisma/client'
import { WelcomeCard } from './WelcomeCard'
import { QuickActionsGrid } from './QuickActionsGrid'
import { ActivityTimeline } from './ActivityTimeline'
import { StatsCards } from './StatsCards'
import { AIInsightsWidget } from './ai-insights-widget'
import { InventoryTrendsWidget } from './inventory-trends-widget'

interface DashboardData {
  userName: string
  userRole: string
  role: UserRole
  todayCount: number
  weekCount: number
  monthCount: number
  totalItems: number
  rejectRate: number
  activeUsers: number
  maisPercentage: number
  fozanPercentage: number
  trendData: number[]
  recentActivities: Array<{
    id: string
    itemName: string
    quantity: number
    destination: string
    enteredBy: string
    createdAt: string
  }>
}

interface RoleBasedDashboardProps {
  data: DashboardData
}

export function RoleBasedDashboard({ data }: RoleBasedDashboardProps) {
  const { role } = data

  // Define what each role can see
  const canSeeAnalytics = ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AUDITOR'].includes(role)
  const canSeeAIInsights = ['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(role)
  const canSeeAllStats = ['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(role)
  const canAddData = ['ADMIN', 'SUPERVISOR', 'DATA_ENTRY'].includes(role)

  return (
    <div className="space-y-6">
      {/* Welcome Card - All roles */}
      <WelcomeCard
        userName={data.userName}
        userRole={data.userRole}
        todayCount={data.todayCount}
        weekCount={data.weekCount}
        monthCount={data.monthCount}
      />

      {/* Quick Actions - All roles (filtered by permissions) */}
      <QuickActionsGrid />

      {/* Stats Cards - Admin, Manager, Supervisor */}
      {canSeeAllStats && (
        <StatsCards
          totalItems={data.totalItems}
          rejectRate={data.rejectRate}
          activeUsers={data.activeUsers}
          maisPercentage={data.maisPercentage}
          fozanPercentage={data.fozanPercentage}
          trendData={data.trendData}
        />
      )}

      {/* AI Insights and Trends - Admin, Manager, Supervisor */}
      {canSeeAIInsights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AIInsightsWidget />
          <InventoryTrendsWidget />
        </div>
      )}

      {/* Activity Timeline - All roles */}
      <ActivityTimeline activities={data.recentActivities} />

      {/* Role-specific messages */}
      {role === 'DATA_ENTRY' && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-primary-900 dark:text-primary-100">
                Quick Tip
              </h4>
              <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">
                Use keyboard shortcuts to speed up data entry. Press <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-primary-300 dark:border-primary-700 text-xs">Ctrl+N</kbd> to quickly add a new item.
              </p>
            </div>
          </div>
        </div>
      )}

      {role === 'AUDITOR' && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100">
                Audit Access
              </h4>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                You have full access to audit logs and system activity. Review recent changes in the Audit section.
              </p>
            </div>
          </div>
        </div>
      )}

      {role === 'MANAGER' && (
        <div className="bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-accent-600 dark:text-accent-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-accent-900 dark:text-accent-100">
                Management Overview
              </h4>
              <p className="text-sm text-accent-700 dark:text-accent-300 mt-1">
                Access comprehensive reports and analytics to make informed decisions. Generate custom reports from the Reports section.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
