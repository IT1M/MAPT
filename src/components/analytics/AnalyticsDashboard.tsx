'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { ChartErrorBoundary } from './ChartErrorBoundary'
import { ChartSkeleton } from './ChartSkeleton'
import { KPICardsSection, type AnalyticsSummary, type FilterType } from './KPICardsSection'
import { GlobalFilters, type AnalyticsFilterState } from './GlobalFilters'
import { AIInsightsPanel } from './AIInsightsPanel'
import { DashboardExporter } from './DashboardExporter'
import {
  InventoryTrendChart,
  DestinationChart,
  CategoryChart,
  RejectAnalysisChart,
  UserActivityHeatmap,
  MonthlyComparisonChart,
  type TrendDataPoint,
  type DestinationData,
  type CategoryDataPoint,
  type RejectDataPoint,
  type HeatmapDataPoint,
  type MonthlyDataPoint,
} from './charts'
import { UserRole, Destination } from '@prisma/client'
import { parseDateParam, parseArrayParam } from '@/utils/urlParams'
import { useSearchParams, useRouter } from 'next/navigation'
import { type DatePresetType } from '@/utils/datePresets'

interface FilterUser {
  id: string
  name: string
  email: string
}

interface DashboardData {
  summary: AnalyticsSummary | null
  trends: TrendDataPoint[]
  destination: DestinationData | null
  categories: CategoryDataPoint[]
  rejectAnalysis: RejectDataPoint[]
  userActivity: HeatmapDataPoint[]
  monthlyComparison: MonthlyDataPoint[]
}

export const AnalyticsDashboard: React.FC = () => {
  const { data: session } = useSession()
  const t = useTranslations()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Initialize filters from URL params
  const initializeFilters = useCallback((): AnalyticsFilterState => {
    const startDate = parseDateParam(searchParams.get('startDate'))
    const endDate = parseDateParam(searchParams.get('endDate'))
    const preset = (searchParams.get('preset') as DatePresetType) || 'last30days'

    const destinationsParam = parseArrayParam(searchParams, 'destinations')
    const destinations = destinationsParam
      .filter((d): d is Destination => d === 'MAIS' || d === 'FOZAN')

    const categories = parseArrayParam(searchParams, 'categories')
    const userIds = parseArrayParam(searchParams, 'userIds')

    return {
      dateRange: {
        start: startDate,
        end: endDate,
        preset: startDate || endDate ? 'custom' : preset,
      },
      destinations,
      categories,
      userIds,
    }
  }, [searchParams])

  // State management
  const [filters, setFilters] = useState<AnalyticsFilterState>(initializeFilters)
  const [data, setData] = useState<DashboardData>({
    summary: null,
    trends: [],
    destination: null,
    categories: [],
    rejectAnalysis: [],
    userActivity: [],
    monthlyComparison: [],
  })
  const [loading, setLoading] = useState({
    summary: true,
    trends: true,
    destination: true,
    categories: true,
    rejectAnalysis: true,
    userActivity: true,
    monthlyComparison: true,
  })
  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableUsers, setAvailableUsers] = useState<FilterUser[]>([])
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [announceMessage, setAnnounceMessage] = useState<string>('')

  // Build query string from filters
  const buildQueryString = useCallback((filterState: AnalyticsFilterState): string => {
    const params = new URLSearchParams()

    if (filterState.dateRange.start) {
      params.append('startDate', filterState.dateRange.start.toISOString())
    }
    if (filterState.dateRange.end) {
      params.append('endDate', filterState.dateRange.end.toISOString())
    }
    if (filterState.dateRange.preset && filterState.dateRange.preset !== 'custom') {
      params.append('preset', filterState.dateRange.preset)
    }

    filterState.destinations.forEach(d => params.append('destination', d))
    filterState.categories.forEach(c => params.append('category', c))
    filterState.userIds.forEach(u => params.append('userId', u))

    return params.toString()
  }, [])

  // Update URL when filters change
  useEffect(() => {
    const queryString = buildQueryString(filters)
    const newUrl = queryString ? `?${queryString}` : window.location.pathname
    router.replace(newUrl, { scroll: false })
  }, [filters, buildQueryString, router])

  // Fetch summary data
  const fetchSummary = useCallback(async (filterState: AnalyticsFilterState) => {
    try {
      setLoading(prev => ({ ...prev, summary: true }))
      setErrors(prev => ({ ...prev, summary: null }))

      const queryString = buildQueryString(filterState)
      const response = await fetch(`/api/analytics/summary?${queryString}`)

      if (!response.ok) {
        throw new Error('Failed to fetch summary data')
      }

      const result = await response.json()

      if (result.success && result.data) {
        const summaryData: AnalyticsSummary = {
          totalItems: result.data.totalItems || 0,
          totalQuantity: result.data.totalQuantity || 0,
          rejectRate: result.data.rejectRate || 0,
          activeUsers: result.data.activeUsers || 0,
          categoriesCount: result.data.byCategory?.length || 0,
          avgDailyEntries: result.data.avgDailyEntries || 0,
          topContributor: result.data.topContributor,
          mostActiveCategory: result.data.byCategory?.[0]?.category,
          maisPercentage: result.data.byDestination?.MAIS
            ? (result.data.byDestination.MAIS.quantity / result.data.totalQuantity) * 100
            : 0,
          fozanPercentage: result.data.byDestination?.FOZAN
            ? (result.data.byDestination.FOZAN.quantity / result.data.totalQuantity) * 100
            : 0,
        }

        setData(prev => ({ ...prev, summary: summaryData }))
      }
    } catch (err) {
      console.error('Error fetching summary:', err)
      setErrors(prev => ({ ...prev, summary: err instanceof Error ? err.message : 'Unknown error' }))
    } finally {
      setLoading(prev => ({ ...prev, summary: false }))
    }
  }, [buildQueryString])

  // Fetch trends data
  const fetchTrends = useCallback(async (filterState: AnalyticsFilterState) => {
    try {
      setLoading(prev => ({ ...prev, trends: true }))
      setErrors(prev => ({ ...prev, trends: null }))

      const queryString = buildQueryString(filterState)
      const response = await fetch(`/api/analytics/trends?${queryString}`)

      if (!response.ok) {
        throw new Error('Failed to fetch trends data')
      }

      const result = await response.json()

      if (result.success && result.data?.timeSeries) {
        setData(prev => ({ ...prev, trends: result.data.timeSeries }))
      }
    } catch (err) {
      console.error('Error fetching trends:', err)
      setErrors(prev => ({ ...prev, trends: err instanceof Error ? err.message : 'Unknown error' }))
    } finally {
      setLoading(prev => ({ ...prev, trends: false }))
    }
  }, [buildQueryString])

  // Fetch destination data (derived from summary)
  const updateDestinationData = useCallback((summaryResult: any) => {
    if (summaryResult?.byDestination) {
      const destData: DestinationData = {
        MAIS: {
          quantity: summaryResult.byDestination.MAIS?.quantity || 0,
          items: summaryResult.byDestination.MAIS?.items || 0,
        },
        FOZAN: {
          quantity: summaryResult.byDestination.FOZAN?.quantity || 0,
          items: summaryResult.byDestination.FOZAN?.items || 0,
        },
      }
      setData(prev => ({ ...prev, destination: destData }))
    }
  }, [])

  // Fetch category data (derived from summary)
  const updateCategoryData = useCallback((summaryResult: any) => {
    if (summaryResult?.byCategory) {
      const catData: CategoryDataPoint[] = summaryResult.byCategory.map((cat: any) => ({
        category: cat.category,
        maisQuantity: cat.maisQuantity || 0,
        fozanQuantity: cat.fozanQuantity || 0,
        totalQuantity: cat.quantity || 0,
      }))
      setData(prev => ({ ...prev, categories: catData }))
    }
  }, [])

  // Fetch reject analysis data
  const fetchRejectAnalysis = useCallback(async (filterState: AnalyticsFilterState) => {
    try {
      setLoading(prev => ({ ...prev, rejectAnalysis: true }))
      setErrors(prev => ({ ...prev, rejectAnalysis: null }))

      const queryString = buildQueryString(filterState)
      const response = await fetch(`/api/analytics/reject-analysis?${queryString}`)

      if (!response.ok) {
        throw new Error('Failed to fetch reject analysis data')
      }

      const result = await response.json()

      if (result.success && result.data?.timeSeries) {
        setData(prev => ({ ...prev, rejectAnalysis: result.data.timeSeries }))
      }
    } catch (err) {
      console.error('Error fetching reject analysis:', err)
      setErrors(prev => ({ ...prev, rejectAnalysis: err instanceof Error ? err.message : 'Unknown error' }))
    } finally {
      setLoading(prev => ({ ...prev, rejectAnalysis: false }))
    }
  }, [buildQueryString])

  // Fetch user activity data
  const fetchUserActivity = useCallback(async (filterState: AnalyticsFilterState) => {
    // Only fetch for ADMIN and SUPERVISOR roles
    if (session?.user?.role !== UserRole.ADMIN && session?.user?.role !== UserRole.SUPERVISOR) {
      setLoading(prev => ({ ...prev, userActivity: false }))
      return
    }

    try {
      setLoading(prev => ({ ...prev, userActivity: true }))
      setErrors(prev => ({ ...prev, userActivity: null }))

      const queryString = buildQueryString(filterState)
      const response = await fetch(`/api/analytics/user-activity?${queryString}`)

      if (!response.ok) {
        throw new Error('Failed to fetch user activity data')
      }

      const result = await response.json()

      if (result.success && result.data?.heatmap) {
        setData(prev => ({ ...prev, userActivity: result.data.heatmap }))
      }
    } catch (err) {
      console.error('Error fetching user activity:', err)
      setErrors(prev => ({ ...prev, userActivity: err instanceof Error ? err.message : 'Unknown error' }))
    } finally {
      setLoading(prev => ({ ...prev, userActivity: false }))
    }
  }, [buildQueryString, session])

  // Fetch monthly comparison data (derived from trends)
  const updateMonthlyComparison = useCallback((trendsData: TrendDataPoint[]) => {
    // Group trends by month
    const monthlyMap = new Map<string, MonthlyDataPoint>()

    trendsData.forEach(point => {
      const date = new Date(point.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          quantity: 0,
          items: 0,
          rejectRate: 0,
        })
      }

      const monthData = monthlyMap.get(monthKey)!
      monthData.quantity += point.totalQuantity
      monthData.items += 1
      monthData.rejectRate = point.rejectQuantity / point.totalQuantity * 100
    })

    const monthlyData = Array.from(monthlyMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    )

    setData(prev => ({ ...prev, monthlyComparison: monthlyData }))
  }, [])

  // Fetch all data
  const fetchAllData = useCallback(async (filterState: AnalyticsFilterState) => {
    setLastUpdated(new Date())

    // Fetch summary first (contains destination and category data)
    const queryString = buildQueryString(filterState)
    const summaryResponse = await fetch(`/api/analytics/summary?${queryString}`)

    if (summaryResponse.ok) {
      const summaryResult = await summaryResponse.json()
      if (summaryResult.success && summaryResult.data) {
        updateDestinationData(summaryResult.data)
        updateCategoryData(summaryResult.data)
      }
    }

    // Fetch other data in parallel
    await Promise.all([
      fetchSummary(filterState),
      fetchTrends(filterState),
      fetchRejectAnalysis(filterState),
      fetchUserActivity(filterState),
    ])

    // Announce update to screen readers
    setAnnounceMessage(t('analytics.dataUpdated'))
  }, [
    buildQueryString,
    fetchSummary,
    fetchTrends,
    fetchRejectAnalysis,
    fetchUserActivity,
    updateDestinationData,
    updateCategoryData,
    t,
  ])

  // Initial data fetch
  useEffect(() => {
    fetchAllData(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Update monthly comparison when trends change
  useEffect(() => {
    if (data.trends.length > 0) {
      updateMonthlyComparison(data.trends)
    }
  }, [data.trends, updateMonthlyComparison])

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchAllData(filters)
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, filters, fetchAllData])

  // Fetch available categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/inventory/data-log?page=1&pageSize=1000')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            const uniqueCategories = Array.from(
              new Set(result.data.map((item: any) => item.category).filter(Boolean))
            ) as string[]
            setAvailableCategories(uniqueCategories)
          }
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }

    fetchCategories()
  }, [])

  // Fetch available users (Admin only)
  useEffect(() => {
    if (session?.user?.role !== UserRole.ADMIN) return

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          const result = await response.json()
          const users = result.data || []
          setAvailableUsers(users.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
          })))
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
      }
    }

    fetchUsers()
  }, [session])

  // Handle filter changes with debouncing
  const handleFilterChange = useCallback((updates: Partial<AnalyticsFilterState>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates }

      // Debounce data fetch
      setTimeout(() => {
        fetchAllData(newFilters)
      }, 300)

      return newFilters
    })
  }, [fetchAllData])

  // Handle filter reset
  const handleReset = useCallback(() => {
    const defaultFilters: AnalyticsFilterState = {
      dateRange: {
        start: null,
        end: null,
        preset: 'last30days',
      },
      destinations: [],
      categories: [],
      userIds: [],
    }

    setFilters(defaultFilters)
    fetchAllData(defaultFilters)
  }, [fetchAllData])

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    fetchAllData(filters)
  }, [filters, fetchAllData])

  // Handle KPI card click for filtering
  const handleKPICardClick = useCallback((filterType: FilterType) => {
    const updates: Partial<AnalyticsFilterState> = {}

    switch (filterType) {
      case 'totalQuantity':
        // Could filter by destination with highest quantity
        if (data.summary) {
          const maisQty = data.destination?.MAIS.quantity || 0
          const fozanQty = data.destination?.FOZAN.quantity || 0
          if (maisQty > fozanQty) {
            updates.destinations = ['MAIS']
          } else if (fozanQty > maisQty) {
            updates.destinations = ['FOZAN']
          }
        }
        break
      case 'rejectRate':
        // Filter to show only items with rejects (handled by backend via query)
        // For now, just refresh the data to highlight reject-related info
        break
      case 'categories':
        if (data.summary?.mostActiveCategory) {
          updates.categories = [data.summary.mostActiveCategory]
        }
        break
      case 'totalItems':
      case 'activeUsers':
      case 'avgDaily':
        // These don't have specific filter actions
        // Could be extended in the future
        break
    }

    if (Object.keys(updates).length > 0) {
      handleFilterChange(updates)
      setAnnounceMessage(t('analytics.filterApplied'))
    }
  }, [data.summary, data.destination, handleFilterChange, t])

  // Handle destination chart click
  const handleDestinationClick = useCallback((destination: 'MAIS' | 'FOZAN') => {
    handleFilterChange({ destinations: [destination] })
    setAnnounceMessage(t('analytics.filterApplied'))
  }, [handleFilterChange, t])

  // Handle category chart click
  const handleCategoryClick = useCallback((category: string) => {
    handleFilterChange({ categories: [category] })
    setAnnounceMessage(t('analytics.filterApplied'))
  }, [handleFilterChange, t])

  // Dashboard context for AI
  const aiDashboardContext = useMemo(() => ({
    summary: data.summary || {
      totalItems: 0,
      totalQuantity: 0,
      rejectRate: 0,
      activeUsers: 0,
      categoriesCount: 0,
      avgDailyEntries: 0,
    },
    trends: data.trends,
  }), [data.summary, data.trends])

  // Dashboard snapshot for export
  const exportDashboardSnapshot = useMemo(() => ({
    summary: data.summary || {
      totalItems: 0,
      totalQuantity: 0,
      rejectRate: 0,
      activeUsers: 0,
      categoriesCount: 0,
      avgDailyEntries: 0,
      maisPercentage: 0,
      fozanPercentage: 0,
    },
    timestamp: lastUpdated,
  }), [data.summary, lastUpdated])

  if (!session) {
    return null
  }

  const isAdmin = session.user.role === UserRole.ADMIN
  const isSupervisor = session.user.role === UserRole.SUPERVISOR || isAdmin

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            📊 {t('analytics.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('analytics.subtitle')}
          </p>
        </div>

        {/* Header Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <DashboardExporter
            dashboardData={exportDashboardSnapshot}
            filters={filters}
          />
        </div>
      </header>

      {/* Global Filters and Controls */}
      <nav aria-label="Dashboard filters">
        <GlobalFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleReset}
          userRole={session.user.role as UserRole}
          availableCategories={availableCategories}
          availableUsers={availableUsers}
          isLoading={Object.values(loading).some(l => l)}
          autoRefresh={autoRefresh}
          onAutoRefreshChange={setAutoRefresh}
          lastUpdated={lastUpdated}
          onRefresh={handleRefresh}
        />
      </nav>

      {/* Main Content */}
      <main id="main-content">
        {/* KPI Cards Section */}
        <section aria-label="Key Performance Indicators" className="mb-6">
          <ChartErrorBoundary chartName="KPI Cards">
            {errors.summary ? (
              <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200">
                  {t('analytics.error')}: {errors.summary}
                </p>
              </div>
            ) : (
              <KPICardsSection
                data={data.summary || {} as AnalyticsSummary}
                loading={loading.summary}
                onCardClick={handleKPICardClick}
              />
            )}
          </ChartErrorBoundary>
        </section>

        {/* Charts Section - Responsive Grid */}
        <section aria-label="Analytics Charts" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Inventory Trend Chart */}
          <ChartErrorBoundary chartName="Inventory Trend">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('analytics.charts.inventoryTrend')}
                </h3>
              </Card.Header>
              <Card.Body>
                {loading.trends ? (
                  <ChartSkeleton />
                ) : errors.trends ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-red-600 dark:text-red-400">{errors.trends}</p>
                  </div>
                ) : (
                  <InventoryTrendChart data={data.trends} />
                )}
              </Card.Body>
            </Card>
          </ChartErrorBoundary>

          {/* Destination Chart */}
          <ChartErrorBoundary chartName="Destination Distribution">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('analytics.charts.destination')}
                </h3>
              </Card.Header>
              <Card.Body>
                {loading.summary ? (
                  <ChartSkeleton />
                ) : errors.summary ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-red-600 dark:text-red-400">{errors.summary}</p>
                  </div>
                ) : data.destination ? (
                  <DestinationChart
                    data={data.destination}
                    onSegmentClick={handleDestinationClick}
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">{t('common.noData')}</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </ChartErrorBoundary>

          {/* Category Chart */}
          <ChartErrorBoundary chartName="Category Performance">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('analytics.charts.category')}
                </h3>
              </Card.Header>
              <Card.Body>
                {loading.summary ? (
                  <ChartSkeleton />
                ) : errors.summary ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-red-600 dark:text-red-400">{errors.summary}</p>
                  </div>
                ) : data.categories.length > 0 ? (
                  <CategoryChart
                    data={data.categories}
                    onBarClick={handleCategoryClick}
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">{t('common.noData')}</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </ChartErrorBoundary>

          {/* Reject Analysis Chart */}
          <ChartErrorBoundary chartName="Reject Analysis">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('analytics.charts.rejectAnalysis')}
                </h3>
              </Card.Header>
              <Card.Body>
                {loading.rejectAnalysis ? (
                  <ChartSkeleton />
                ) : errors.rejectAnalysis ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-red-600 dark:text-red-400">{errors.rejectAnalysis}</p>
                  </div>
                ) : data.rejectAnalysis.length > 0 ? (
                  <RejectAnalysisChart data={data.rejectAnalysis} />
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">{t('common.noData')}</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </ChartErrorBoundary>
        </section>

        {/* Full Width Charts Section */}
        <section aria-label="Extended Analytics" className="grid grid-cols-1 gap-6 mb-6">
          {/* User Activity Heatmap - Only for ADMIN/SUPERVISOR */}
          {isSupervisor && (
            <ChartErrorBoundary chartName="User Activity">
              <Card>
                <Card.Header>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('analytics.charts.userActivity')}
                  </h3>
                </Card.Header>
                <Card.Body>
                  {loading.userActivity ? (
                    <ChartSkeleton />
                  ) : errors.userActivity ? (
                    <div className="h-64 flex items-center justify-center">
                      <p className="text-red-600 dark:text-red-400">{errors.userActivity}</p>
                    </div>
                  ) : data.userActivity.length > 0 ? (
                    <UserActivityHeatmap data={data.userActivity} />
                  ) : (
                    <div className="h-64 flex items-center justify-center">
                      <p className="text-gray-500 dark:text-gray-400">{t('common.noData')}</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </ChartErrorBoundary>
          )}

          {/* Monthly Comparison Chart */}
          <ChartErrorBoundary chartName="Monthly Comparison">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('analytics.charts.monthlyComparison')}
                </h3>
              </Card.Header>
              <Card.Body>
                {loading.trends ? (
                  <ChartSkeleton />
                ) : errors.trends ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-red-600 dark:text-red-400">{errors.trends}</p>
                  </div>
                ) : data.monthlyComparison.length > 0 ? (
                  <MonthlyComparisonChart data={data.monthlyComparison} />
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">{t('common.noData')}</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </ChartErrorBoundary>
        </section>

        {/* AI Insights and Q&A Section */}
        <section aria-label="AI Insights">
          <ChartErrorBoundary chartName="AI Insights">
            <AIInsightsPanel
              dashboardData={aiDashboardContext}
              filters={filters}
            />
          </ChartErrorBoundary>
        </section>
      </main>

      {/* Live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="analytics-announcements"
      >
        {announceMessage}
      </div>
    </div>
  )
}
