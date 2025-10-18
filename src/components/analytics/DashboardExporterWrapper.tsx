'use client'

import { useState, useEffect } from 'react'
import { DashboardExporter, DashboardSnapshot } from './DashboardExporter'

/**
 * Wrapper component for DashboardExporter that manages dashboard data state
 * This component fetches the current dashboard data and passes it to the exporter
 */
export function DashboardExporterWrapper() {
  const [dashboardData, setDashboardData] = useState<DashboardSnapshot | null>(null)
  const [filters, setFilters] = useState<{
    startDate?: Date | null
    endDate?: Date | null
    destinations?: string[]
    categories?: string[]
  }>({})

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch summary data
      const summaryResponse = await fetch('/api/analytics/summary')
      if (!summaryResponse.ok) {
        throw new Error('Failed to fetch summary data')
      }

      const summaryResult = await summaryResponse.json()
      if (!summaryResult.success) {
        throw new Error(summaryResult.error?.message || 'Failed to fetch summary')
      }

      const summaryData = summaryResult.data

      // Calculate percentages
      const totalQuantity = summaryData.totalQuantity || 1
      const maisQuantity = summaryData.byDestination?.MAIS?.quantity || 0
      const fozanQuantity = summaryData.byDestination?.FOZAN?.quantity || 0

      const maisPercentage = (maisQuantity / totalQuantity) * 100
      const fozanPercentage = (fozanQuantity / totalQuantity) * 100

      // Get most active category
      const mostActiveCategory = summaryData.byCategory?.[0]?.category || undefined

      // Build dashboard snapshot
      const snapshot: DashboardSnapshot = {
        summary: {
          totalItems: summaryData.totalItems || 0,
          totalQuantity: summaryData.totalQuantity || 0,
          rejectRate: summaryData.rejectRate || 0,
          activeUsers: summaryData.activeUsers || 0,
          categoriesCount: summaryData.byCategory?.length || 0,
          avgDailyEntries: summaryData.avgDailyEntries || 0,
          maisPercentage,
          fozanPercentage,
          topContributor: summaryData.topContributor,
          mostActiveCategory,
        },
        charts: [],
        insights: [],
        timestamp: new Date(),
      }

      setDashboardData(snapshot)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      // Set minimal data to allow export button to render
      setDashboardData({
        summary: {
          totalItems: 0,
          totalQuantity: 0,
          rejectRate: 0,
          activeUsers: 0,
          categoriesCount: 0,
          avgDailyEntries: 0,
          maisPercentage: 0,
          fozanPercentage: 0,
        },
        charts: [],
        insights: [],
        timestamp: new Date(),
      })
    }
  }

  const handleExportComplete = () => {
    // Optionally refresh data after export
    console.log('Export completed successfully')
  }

  if (!dashboardData) {
    return null
  }

  return (
    <DashboardExporter
      dashboardData={dashboardData}
      filters={filters}
      onExportComplete={handleExportComplete}
    />
  )
}
