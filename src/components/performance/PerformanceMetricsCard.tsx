'use client'

import React from 'react'
import { Activity, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  status?: 'good' | 'warning' | 'critical'
  icon?: React.ReactNode
}

export function PerformanceMetricCard({
  title,
  value,
  subtitle,
  trend,
  status = 'good',
  icon,
}: MetricCardProps) {
  const statusColors = {
    good: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    critical: 'bg-red-50 border-red-200 text-red-700',
  }

  const statusIcons = {
    good: <CheckCircle className="w-5 h-5 text-green-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
    critical: <AlertTriangle className="w-5 h-5 text-red-600" />,
  }

  const trendIcons = {
    up: <TrendingUp className="w-4 h-4 text-green-600" />,
    down: <TrendingDown className="w-4 h-4 text-red-600" />,
    neutral: null,
  }

  return (
    <div className={`rounded-lg border-2 p-6 ${statusColors[status]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {icon || <Activity className="w-5 h-5" />}
            <h3 className="text-sm font-medium">{title}</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">{value}</p>
            {trend && trendIcons[trend]}
          </div>
          {subtitle && (
            <p className="text-sm mt-1 opacity-75">{subtitle}</p>
          )}
        </div>
        <div>{statusIcons[status]}</div>
      </div>
    </div>
  )
}

interface MetricsGridProps {
  metrics: {
    p50: number
    p95: number
    p99: number
    avgResponseTime: number
    totalRequests: number
    errorRate: number
  }
}

export function PerformanceMetricsGrid({ metrics }: MetricsGridProps) {
  const getResponseTimeStatus = (time: number): 'good' | 'warning' | 'critical' => {
    if (time < 500) return 'good'
    if (time < 2000) return 'warning'
    return 'critical'
  }

  const getErrorRateStatus = (rate: number): 'good' | 'warning' | 'critical' => {
    if (rate < 0.01) return 'good'
    if (rate < 0.05) return 'warning'
    return 'critical'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <PerformanceMetricCard
        title="Average Response Time"
        value={`${metrics.avgResponseTime.toFixed(0)}ms`}
        subtitle="Mean API response time"
        status={getResponseTimeStatus(metrics.avgResponseTime)}
      />
      
      <PerformanceMetricCard
        title="P50 Response Time"
        value={`${metrics.p50.toFixed(0)}ms`}
        subtitle="50th percentile"
        status={getResponseTimeStatus(metrics.p50)}
      />
      
      <PerformanceMetricCard
        title="P95 Response Time"
        value={`${metrics.p95.toFixed(0)}ms`}
        subtitle="95th percentile"
        status={getResponseTimeStatus(metrics.p95)}
      />
      
      <PerformanceMetricCard
        title="P99 Response Time"
        value={`${metrics.p99.toFixed(0)}ms`}
        subtitle="99th percentile"
        status={getResponseTimeStatus(metrics.p99)}
      />
      
      <PerformanceMetricCard
        title="Total Requests"
        value={metrics.totalRequests.toLocaleString()}
        subtitle="In selected time range"
        status="good"
      />
      
      <PerformanceMetricCard
        title="Error Rate"
        value={`${(metrics.errorRate * 100).toFixed(2)}%`}
        subtitle={`${Math.round(metrics.totalRequests * metrics.errorRate)} errors`}
        status={getErrorRateStatus(metrics.errorRate)}
      />
    </div>
  )
}
