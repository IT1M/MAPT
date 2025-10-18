'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

interface ChartSkeletonProps {
  title?: string;
  height?: number;
  showLegend?: boolean;
  showControls?: boolean;
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  title,
  height = 400,
  showLegend = true,
  showControls = true,
}) => {
  return (
    <Card>
      <div className="p-6 animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          {showControls && (
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          )}
        </div>

        {/* Chart Area */}
        <div
          className="bg-gray-100 dark:bg-gray-800 rounded-lg relative overflow-hidden"
          style={{ height: `${height}px` }}
        >
          {/* Simulated chart elements */}
          <div className="absolute inset-0 flex items-end justify-around p-4 gap-2">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 dark:bg-gray-700 rounded-t w-full"
                style={{
                  height: `${Math.random() * 60 + 20}%`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex items-center justify-center gap-6 mt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 w-3 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

// ============================================================================
// KPI Card Skeleton
// ============================================================================

export const KPICardSkeleton: React.FC = () => {
  return (
    <Card className="animate-pulse">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-16 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </Card>
  );
};

// ============================================================================
// Dashboard Skeleton
// ============================================================================

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="flex gap-4 flex-wrap">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          />
        ))}
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <ChartSkeleton key={i} height={300} />
        ))}
      </div>

      {/* Full Width Charts Skeleton */}
      <div className="grid grid-cols-1 gap-6">
        {[...Array(2)].map((_, i) => (
          <ChartSkeleton key={i} height={400} />
        ))}
      </div>
    </div>
  );
};
