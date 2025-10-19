import { SkeletonCard, SkeletonStats, SkeletonTable } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Welcome Section Skeleton */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-lg p-6 shadow-lg">
        <div className="space-y-3">
          <div className="h-8 bg-primary-400/30 dark:bg-primary-500/30 rounded w-2/3 animate-pulse" />
          <div className="h-6 bg-primary-400/30 dark:bg-primary-500/30 rounded w-1/3 animate-pulse" />
        </div>
      </div>

      {/* Metrics Grid Skeleton */}
      <SkeletonStats count={3} />

      {/* AI Widgets Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard hasHeader lines={5} />
        <SkeletonCard hasHeader lines={5} />
      </div>

      {/* Recent Transactions Table Skeleton */}
      <SkeletonTable rows={10} columns={4} hasHeader />
    </div>
  )
}
