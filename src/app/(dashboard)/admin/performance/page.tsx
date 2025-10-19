'use client'

import React, { useState, useEffect } from 'react'
import { RefreshCw, Download, Clock } from 'lucide-react'
import { PerformanceMetricsGrid } from '@/components/performance/PerformanceMetricsCard'
import { AlertsPanel } from '@/components/performance/AlertsPanel'
import { SlowEndpointsTable } from '@/components/performance/SlowEndpointsTable'
import { OptimizationRecommendations } from '@/components/performance/OptimizationRecommendations'

interface PerformanceData {
  stats: {
    apiMetrics: {
      p50: number
      p95: number
      p99: number
      avgResponseTime: number
      totalRequests: number
      errorRate: number
    }
    errorMetrics: {
      total: number
      byType: Record<string, number>
      byEndpoint: Record<string, number>
    }
    slowEndpoints: Array<{
      endpoint: string
      avgDuration: number
      count: number
    }>
  }
  alerts: Array<{
    rule: string
    message: string
    severity: 'warning' | 'critical'
  }>
}

interface RecommendationsData {
  analysis: {
    summary: string
    criticalIssues: string[]
    recommendations: Array<{
      id: string
      title: string
      description: string
      priority: 'high' | 'medium' | 'low'
      category: 'api' | 'database' | 'frontend' | 'infrastructure'
      impact: string
      effort: 'low' | 'medium' | 'high'
      documentationLinks: string[]
      implementationSteps: string[]
      estimatedImprovement: string
      implemented: boolean
    }>
    confidence: number
  }
  progress: {
    total: number
    implemented: number
    percentage: number
  }
}

export default function PerformanceDashboardPage() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [recommendationsData, setRecommendationsData] = useState<RecommendationsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState(60) // minutes
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (forceRefresh = false) => {
    try {
      setRefreshing(true)
      setError(null)

      // Fetch performance metrics
      const metricsRes = await fetch(`/api/performance/metrics?minutes=${timeRange}`)
      if (!metricsRes.ok) {
        throw new Error('Failed to fetch performance metrics')
      }
      const metricsData = await metricsRes.json()
      setPerformanceData(metricsData.data)

      // Fetch recommendations
      const recsRes = await fetch(
        `/api/performance/recommendations${forceRefresh ? '?refresh=true' : ''}`
      )
      if (!recsRes.ok) {
        throw new Error('Failed to fetch recommendations')
      }
      const recsData = await recsRes.json()
      setRecommendationsData(recsData.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching performance data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => fetchData(), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [timeRange])

  const handleMarkImplemented = async (recommendationId: string) => {
    try {
      const res = await fetch('/api/performance/recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId }),
      })

      if (!res.ok) {
        throw new Error('Failed to update recommendation')
      }

      // Refresh data
      await fetchData()
    } catch (err) {
      console.error('Error marking recommendation as implemented:', err)
      alert('Failed to update recommendation')
    }
  }

  const handleExportMetrics = () => {
    if (!performanceData) return

    const data = {
      exportedAt: new Date().toISOString(),
      timeRange: `${timeRange} minutes`,
      metrics: performanceData.stats,
      alerts: performanceData.alerts,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-metrics-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading performance data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <h3 className="text-red-900 font-semibold mb-2">Error Loading Performance Data</h3>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => fetchData()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Monitoring</h1>
          <p className="text-gray-600 mt-1">
            Real-time system performance metrics and AI-powered optimization recommendations
          </p>
        </div>

        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={e => setTimeRange(Number(e.target.value))}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value={15}>Last 15 minutes</option>
            <option value={60}>Last hour</option>
            <option value={180}>Last 3 hours</option>
            <option value={360}>Last 6 hours</option>
            <option value={1440}>Last 24 hours</option>
          </select>

          <button
            onClick={handleExportMetrics}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      {performanceData && (
        <>
          <PerformanceMetricsGrid metrics={performanceData.stats.apiMetrics} />

          {/* Alerts */}
          <AlertsPanel alerts={performanceData.alerts} />

          {/* Slow Endpoints */}
          <SlowEndpointsTable endpoints={performanceData.stats.slowEndpoints} />
        </>
      )}

      {/* AI Recommendations */}
      {recommendationsData && (
        <>
          {/* Critical Issues */}
          {recommendationsData.analysis.criticalIssues.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-3">Critical Issues</h3>
              <ul className="space-y-2">
                {recommendationsData.analysis.criticalIssues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-2 text-red-800">
                    <span className="text-red-600 mt-1">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Performance Summary</h3>
            <p className="text-blue-800">{recommendationsData.analysis.summary}</p>
            {recommendationsData.progress.total > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-blue-700">Implementation Progress</span>
                  <span className="font-semibold text-blue-900">
                    {recommendationsData.progress.implemented} / {recommendationsData.progress.total}{' '}
                    ({recommendationsData.progress.percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${recommendationsData.progress.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Recommendations */}
          <OptimizationRecommendations
            recommendations={recommendationsData.analysis.recommendations}
            onMarkImplemented={handleMarkImplemented}
            confidence={recommendationsData.analysis.confidence}
          />
        </>
      )}
    </div>
  )
}
