'use client';

import React, { useState, useEffect } from 'react';
import {
  KPICardsSection,
  AnalyticsSummary,
  FilterType,
} from './KPICardsSection';

export interface KPICardsSectionWrapperProps {
  onFilterChange?: (filterType: FilterType) => void;
}

export const KPICardsSectionWrapper: React.FC<KPICardsSectionWrapperProps> = ({
  onFilterChange,
}) => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [previousData, setPreviousData] = useState<AnalyticsSummary | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch current period data
        const response = await fetch('/api/analytics/summary');

        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const result = await response.json();

        if (result.success && result.data) {
          // Transform API response to AnalyticsSummary format
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
              ? (result.data.byDestination.MAIS.quantity /
                  result.data.totalQuantity) *
                100
              : 0,
            fozanPercentage: result.data.byDestination?.FOZAN
              ? (result.data.byDestination.FOZAN.quantity /
                  result.data.totalQuantity) *
                100
              : 0,
          };

          setData(summaryData);

          // TODO: Fetch previous period data for trend comparison
          // For now, we'll set it to null
          setPreviousData(null);
        } else {
          throw new Error(result.error || 'Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCardClick = (filterType: FilterType) => {
    console.log('KPI card clicked:', filterType);
    if (onFilterChange) {
      onFilterChange(filterType);
    }
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-800 dark:text-red-200">
          Error loading analytics: {error}
        </p>
      </div>
    );
  }

  if (loading || !data) {
    return <KPICardsSection data={{} as AnalyticsSummary} loading={true} />;
  }

  return (
    <KPICardsSection
      data={data}
      previousData={previousData || undefined}
      onCardClick={handleCardClick}
      loading={false}
    />
  );
};
