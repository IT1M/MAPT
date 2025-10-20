'use client';

import React from 'react';
import { Skeleton } from './skeleton';

export interface ChartSkeletonProps {
  type?: 'bar' | 'line' | 'pie' | 'area';
  className?: string;
  height?: number;
  showLegend?: boolean;
  showTitle?: boolean;
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  type = 'bar',
  className = '',
  height = 300,
  showLegend = true,
  showTitle = true,
}) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      {/* Title */}
      {showTitle && (
        <div className="mb-4">
          <Skeleton width="40%" height={24} className="mb-2" />
          <Skeleton width="60%" height={16} />
        </div>
      )}

      {/* Chart Area */}
      <div className="relative" style={{ height: `${height}px` }}>
        {type === 'bar' && <BarChartSkeleton />}
        {type === 'line' && <LineChartSkeleton />}
        {type === 'pie' && <PieChartSkeleton />}
        {type === 'area' && <AreaChartSkeleton />}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 flex flex-wrap gap-4 justify-center">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton width={16} height={16} variant="rectangular" />
              <Skeleton width={60} height={16} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const BarChartSkeleton: React.FC = () => {
  return (
    <div className="h-full flex items-end justify-around gap-2 px-4 pb-8">
      {[60, 80, 45, 90, 70, 55, 85, 65].map((height, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <Skeleton
            width="100%"
            height={`${height}%`}
            variant="rectangular"
            className="rounded-t"
          />
          <Skeleton width="100%" height={12} />
        </div>
      ))}
    </div>
  );
};

const LineChartSkeleton: React.FC = () => {
  return (
    <div className="h-full relative">
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between py-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-px bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
      {/* Line path placeholder */}
      <div className="absolute inset-0 flex items-center px-4">
        <Skeleton width="100%" height={2} variant="rectangular" />
      </div>
      {/* Data points */}
      <div className="absolute inset-0 flex items-center justify-around px-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} width={8} height={8} variant="circular" />
        ))}
      </div>
    </div>
  );
};

const PieChartSkeleton: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center">
      <Skeleton width={200} height={200} variant="circular" />
    </div>
  );
};

const AreaChartSkeleton: React.FC = () => {
  return (
    <div className="h-full relative">
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between py-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-px bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
      {/* Area fill placeholder */}
      <div className="absolute inset-0 flex items-end px-4 pb-8">
        <div className="w-full h-3/4 bg-gradient-to-t from-primary-200 to-transparent dark:from-primary-900/30 rounded-t-lg animate-pulse" />
      </div>
    </div>
  );
};

/**
 * Multiple charts grid skeleton
 */
export interface ChartsGridSkeletonProps {
  count?: number;
  columns?: 1 | 2 | 3;
  className?: string;
}

export const ChartsGridSkeleton: React.FC<ChartsGridSkeletonProps> = ({
  count = 4,
  columns = 2,
  className = '',
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <ChartSkeleton key={i} type={i % 2 === 0 ? 'bar' : 'line'} />
      ))}
    </div>
  );
};
