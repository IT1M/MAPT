'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { useIntersectionObserver } from '@/utils/performance';
import { ChartSkeleton } from './ChartSkeleton';
import { ChartErrorBoundary } from './ChartErrorBoundary';

interface LazyChartProps {
  importFn: () => Promise<{ default: ComponentType<any> }>;
  componentProps: any;
  skeletonHeight?: number;
  chartName?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazyChart: React.FC<LazyChartProps> = ({
  importFn,
  componentProps,
  skeletonHeight = 400,
  chartName,
  threshold = 0.1,
  rootMargin = '100px',
}) => {
  const [containerRef, isVisible] = useIntersectionObserver({
    threshold,
    rootMargin,
    freezeOnceVisible: true,
  });

  // Lazy load the component
  const LazyComponent = React.useMemo(
    () => lazy(importFn),
    [importFn]
  );

  return (
    <div ref={containerRef} className="min-h-[200px]">
      {isVisible ? (
        <ChartErrorBoundary chartName={chartName}>
          <Suspense fallback={<ChartSkeleton height={skeletonHeight} />}>
            <LazyComponent {...componentProps} />
          </Suspense>
        </ChartErrorBoundary>
      ) : (
        <ChartSkeleton height={skeletonHeight} />
      )}
    </div>
  );
};

// ============================================================================
// Prebuilt Lazy Chart Components
// ============================================================================

export const LazyInventoryTrendChart: React.FC<any> = (props) => (
  <LazyChart
    importFn={() => import('./charts/InventoryTrendChart').then(m => ({ default: m.InventoryTrendChart }))}
    componentProps={props}
    chartName="Inventory Trend Chart"
    skeletonHeight={400}
  />
);

export const LazyDestinationChart: React.FC<any> = (props) => (
  <LazyChart
    importFn={() => import('./charts/DestinationChart').then(m => ({ default: m.DestinationChart }))}
    componentProps={props}
    chartName="Destination Chart"
    skeletonHeight={400}
  />
);

export const LazyCategoryChart: React.FC<any> = (props) => (
  <LazyChart
    importFn={() => import('./charts/CategoryChart').then(m => ({ default: m.CategoryChart }))}
    componentProps={props}
    chartName="Category Chart"
    skeletonHeight={400}
  />
);

export const LazyRejectAnalysisChart: React.FC<any> = (props) => (
  <LazyChart
    importFn={() => import('./charts/RejectAnalysisChart').then(m => ({ default: m.RejectAnalysisChart }))}
    componentProps={props}
    chartName="Reject Analysis Chart"
    skeletonHeight={400}
  />
);

export const LazyUserActivityHeatmap: React.FC<any> = (props) => (
  <LazyChart
    importFn={() => import('./charts/UserActivityHeatmap').then(m => ({ default: m.UserActivityHeatmap }))}
    componentProps={props}
    chartName="User Activity Heatmap"
    skeletonHeight={500}
  />
);

export const LazyMonthlyComparisonChart: React.FC<any> = (props) => (
  <LazyChart
    importFn={() => import('./charts/MonthlyComparisonChart').then(m => ({ default: m.MonthlyComparisonChart }))}
    componentProps={props}
    chartName="Monthly Comparison Chart"
    skeletonHeight={400}
  />
);
