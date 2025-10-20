'use client';

import React, { useMemo } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { KPICard } from './KPICard';

export interface AnalyticsSummary {
  totalItems: number;
  totalQuantity: number;
  rejectRate: number;
  activeUsers: number;
  categoriesCount: number;
  avgDailyEntries: number;
  topContributor?: { name: string; count: number };
  mostActiveCategory?: string;
  maisPercentage: number;
  fozanPercentage: number;
}

export interface KPICardsSectionProps {
  data: AnalyticsSummary;
  previousData?: AnalyticsSummary;
  onCardClick?: (filter: FilterType) => void;
  loading?: boolean;
}

export type FilterType =
  | 'totalItems'
  | 'totalQuantity'
  | 'rejectRate'
  | 'activeUsers'
  | 'categories'
  | 'avgDaily';

const calculateTrend = (
  current: number,
  previous?: number
): { direction: 'up' | 'down' | 'stable'; percentage: number } => {
  if (!previous || previous === 0) {
    return { direction: 'stable', percentage: 0 };
  }

  const change = ((current - previous) / previous) * 100;

  if (Math.abs(change) < 1) {
    return { direction: 'stable', percentage: 0 };
  }

  return {
    direction: change > 0 ? 'up' : 'down',
    percentage: Math.abs(change),
  };
};

const getRejectRateColor = (rate: number): 'success' | 'warning' | 'danger' => {
  if (rate < 5) return 'success';
  if (rate < 10) return 'warning';
  return 'danger';
};

export const KPICardsSection: React.FC<KPICardsSectionProps> = ({
  data,
  previousData,
  onCardClick,
  loading = false,
}) => {
  const t = useTranslations('analytics.kpi');

  // Calculate trends
  const trends = useMemo(() => {
    if (!previousData) return null;

    return {
      totalItems: calculateTrend(data.totalItems, previousData.totalItems),
      totalQuantity: calculateTrend(
        data.totalQuantity,
        previousData.totalQuantity
      ),
      rejectRate: calculateTrend(data.rejectRate, previousData.rejectRate),
      activeUsers: calculateTrend(data.activeUsers, previousData.activeUsers),
      categoriesCount: calculateTrend(
        data.categoriesCount,
        previousData.categoriesCount
      ),
      avgDailyEntries: calculateTrend(
        data.avgDailyEntries,
        previousData.avgDailyEntries
      ),
    };
  }, [data, previousData]);

  // Generate sparkline data (mock data for now - would come from API in real implementation)
  const generateSparklineData = (baseValue: number): number[] => {
    const data: number[] = [];
    for (let i = 0; i < 7; i++) {
      const variance = Math.random() * 0.2 - 0.1; // ±10% variance
      data.push(baseValue * (1 + variance));
    }
    return data;
  };

  const handleCardClick = (filterType: FilterType) => {
    if (onCardClick) {
      onCardClick(filterType);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Total Items Card */}
      <KPICard
        title={t('totalItems')}
        value={data.totalItems}
        icon="📦"
        trend={
          trends ? { ...trends.totalItems, label: 'vs prev period' } : undefined
        }
        sparklineData={generateSparklineData(data.totalItems)}
        color="primary"
        onClick={() => handleCardClick('totalItems')}
        loading={loading}
      />

      {/* Total Quantity Card */}
      <KPICard
        title={t('totalQuantity')}
        value={data.totalQuantity}
        subtitle={`Mais: ${data.maisPercentage.toFixed(1)}% | Fozan: ${data.fozanPercentage.toFixed(1)}%`}
        icon="📊"
        trend={
          trends
            ? { ...trends.totalQuantity, label: 'vs prev period' }
            : undefined
        }
        sparklineData={generateSparklineData(data.totalQuantity)}
        color="primary"
        onClick={() => handleCardClick('totalQuantity')}
        loading={loading}
      />

      {/* Reject Rate Card */}
      <KPICard
        title={t('rejectRate')}
        value={`${data.rejectRate.toFixed(2)}%`}
        icon="⚠️"
        trend={
          trends
            ? {
                ...trends.rejectRate,
                label: 'vs prev period',
                // Invert direction for reject rate (down is good)
                direction:
                  trends.rejectRate.direction === 'up'
                    ? 'down'
                    : trends.rejectRate.direction === 'down'
                      ? 'up'
                      : 'stable',
              }
            : undefined
        }
        sparklineData={generateSparklineData(data.rejectRate)}
        color={getRejectRateColor(data.rejectRate)}
        onClick={() => handleCardClick('rejectRate')}
        loading={loading}
      />

      {/* Active Users Card */}
      <KPICard
        title={t('activeUsers')}
        value={data.activeUsers}
        subtitle={
          data.topContributor
            ? `Top: ${data.topContributor.name} (${data.topContributor.count})`
            : undefined
        }
        icon="👥"
        trend={
          trends
            ? { ...trends.activeUsers, label: 'vs prev period' }
            : undefined
        }
        sparklineData={generateSparklineData(data.activeUsers)}
        color="primary"
        onClick={() => handleCardClick('activeUsers')}
        loading={loading}
      />

      {/* Categories Card */}
      <KPICard
        title={t('categories')}
        value={data.categoriesCount}
        subtitle={
          data.mostActiveCategory
            ? `Most active: ${data.mostActiveCategory}`
            : undefined
        }
        icon="🏷️"
        trend={
          trends
            ? { ...trends.categoriesCount, label: 'vs prev period' }
            : undefined
        }
        sparklineData={generateSparklineData(data.categoriesCount)}
        color="primary"
        onClick={() => handleCardClick('categories')}
        loading={loading}
      />

      {/* Average Daily Entries Card */}
      <KPICard
        title={t('avgDaily')}
        value={data.avgDailyEntries.toFixed(1)}
        icon="📈"
        trend={
          trends
            ? { ...trends.avgDailyEntries, label: 'vs prev period' }
            : undefined
        }
        sparklineData={generateSparklineData(data.avgDailyEntries)}
        color="primary"
        onClick={() => handleCardClick('avgDaily')}
        loading={loading}
      />
    </div>
  );
};
