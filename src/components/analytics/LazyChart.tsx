'use client'

import { lazy, Suspense, ComponentType } from 'react'
import { ChartSkeleton } from './ChartSkeleton'

// Lazy load individual chart components for better code splitting
const InventoryTrendChart = lazy(() =>
  import('./charts/InventoryTrendChart').then((mod) => ({ default: mod.InventoryTrendChart }))
)

const DestinationChart = lazy(() =>
  import('./charts/DestinationChart').then((mod) => ({ default: mod.DestinationChart }))
)

const CategoryChart = lazy(() =>
  import('./charts/CategoryChart').then((mod) => ({ default: mod.CategoryChart }))
)

const RejectAnalysisChart = lazy(() =>
  import('./charts/RejectAnalysisChart').then((mod) => ({ default: mod.RejectAnalysisChart }))
)

const UserActivityHeatmap = lazy(() =>
  import('./charts/UserActivityHeatmap').then((mod) => ({ default: mod.UserActivityHeatmap }))
)

const MonthlyComparisonChart = lazy(() =>
  import('./charts/MonthlyComparisonChart').then((mod) => ({ default: mod.MonthlyComparisonChart }))
)

// Wrapper components with Suspense and loading fallback
export const LazyInventoryTrendChart: ComponentType<any> = (props) => (
  <Suspense fallback={<ChartSkeleton />}>
    <InventoryTrendChart {...props} />
  </Suspense>
)

export const LazyDestinationChart: ComponentType<any> = (props) => (
  <Suspense fallback={<ChartSkeleton />}>
    <DestinationChart {...props} />
  </Suspense>
)

export const LazyCategoryChart: ComponentType<any> = (props) => (
  <Suspense fallback={<ChartSkeleton />}>
    <CategoryChart {...props} />
  </Suspense>
)

export const LazyRejectAnalysisChart: ComponentType<any> = (props) => (
  <Suspense fallback={<ChartSkeleton />}>
    <RejectAnalysisChart {...props} />
  </Suspense>
)

export const LazyUserActivityHeatmap: ComponentType<any> = (props) => (
  <Suspense fallback={<ChartSkeleton />}>
    <UserActivityHeatmap {...props} />
  </Suspense>
)

export const LazyMonthlyComparisonChart: ComponentType<any> = (props) => (
  <Suspense fallback={<ChartSkeleton />}>
    <MonthlyComparisonChart {...props} />
  </Suspense>
)
