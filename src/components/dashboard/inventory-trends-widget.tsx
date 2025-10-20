'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useTranslations } from '@/hooks/useTranslations';

interface InventoryTrend {
  product: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  recommendation: string;
}

interface ApiResponse {
  success: boolean;
  data?: InventoryTrend[];
  error?: {
    code: string;
    message: string;
  };
}

export function InventoryTrendsWidget() {
  const t = useTranslations();
  const [trends, setTrends] = useState<InventoryTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/ai/trends');
      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to fetch trends');
      }

      setTrends(data.data || []);
    } catch (err: any) {
      console.error('Error fetching inventory trends:', err);
      setError(err.message || 'Failed to load trends');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return (
          <svg
            className="w-6 h-6 text-accent-600 dark:text-accent-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        );
      case 'decreasing':
        return (
          <svg
            className="w-6 h-6 text-danger-600 dark:text-danger-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
            />
          </svg>
        );
      case 'stable':
      default:
        return (
          <svg
            className="w-6 h-6 text-primary-600 dark:text-primary-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 12h14"
            />
          </svg>
        );
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'bg-accent-50 dark:bg-accent-900/20 border-accent-200 dark:border-accent-800';
      case 'decreasing':
        return 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800';
      case 'stable':
      default:
        return 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800';
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return t('dashboard.trendIncreasing');
      case 'decreasing':
        return t('dashboard.trendDecreasing');
      case 'stable':
      default:
        return t('dashboard.trendStable');
    }
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-6 h-6 text-primary-600 dark:text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {t('dashboard.trends')}
            </h3>
          </div>
          {!loading && !error && (
            <button
              onClick={fetchTrends}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              aria-label="Refresh trends"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}
        </div>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">
              {t('common.loading')}...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <svg
              className="w-16 h-16 text-danger-400 dark:text-danger-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-danger-600 dark:text-danger-400 text-center mb-4">
              {error}
            </p>
            <button
              onClick={fetchTrends}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : trends.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              {t('dashboard.noTrends')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {trends.map((trend, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getTrendColor(trend.trend)}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getTrendIcon(trend.trend)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {trend.product}
                      </h4>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                        {formatConfidence(trend.confidence)}{' '}
                        {t('dashboard.confidence')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {getTrendLabel(trend.trend)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {trend.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
