'use client';

import { useEffect, useState } from 'react';

interface QualityMetrics {
  overallRejectRate: number;
  highRejectItems: number;
  qualityTrend: 'improving' | 'declining' | 'stable';
  topIssues: Array<{
    issue: string;
    count: number;
  }>;
}

export function QualityControlDashboard() {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQualityMetrics();
  }, []);

  const fetchQualityMetrics = async () => {
    try {
      const response = await fetch('/api/dashboard/quality-metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch quality metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 dark:text-gray-400">
          Failed to load quality metrics
        </p>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (metrics.qualityTrend === 'improving') {
      return (
        <svg
          className="w-5 h-5 text-green-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (metrics.qualityTrend === 'declining') {
      return (
        <svg
          className="w-5 h-5 text-red-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return (
      <svg
        className="w-5 h-5 text-gray-600"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  const getRejectRateColor = (rate: number) => {
    if (rate < 5) return 'text-green-600 dark:text-green-400';
    if (rate < 10) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Quality Control Dashboard
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Overall Reject Rate
          </p>
          <p
            className={`text-3xl font-bold ${getRejectRateColor(metrics.overallRejectRate)}`}
          >
            {metrics.overallRejectRate.toFixed(1)}%
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            High Reject Items
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {metrics.highRejectItems}
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Quality Trend
          </p>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
              {metrics.qualityTrend}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Top Quality Issues
        </h4>
        <div className="space-y-2">
          {metrics.topIssues.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No issues reported
            </p>
          ) : (
            metrics.topIssues.map((issue, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {issue.issue}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {issue.count}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
