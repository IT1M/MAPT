'use client';

import { useEffect, useState } from 'react';

interface AnalyticsData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

export function AnalyticsOverview() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/dashboard/analytics?range=${timeRange}`
      );
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 dark:text-gray-400">
          Failed to load analytics
        </p>
      </div>
    );
  }

  const maxValue = Math.max(...data.datasets.flatMap((d) => d.data), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Analytics Overview
        </h3>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {range === '7d'
                ? '7 Days'
                : range === '30d'
                  ? '30 Days'
                  : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {data.datasets.map((dataset, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {dataset.label}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total: {dataset.data.reduce((a, b) => a + b, 0)}
              </span>
            </div>
            <div className="flex items-end gap-1 h-32">
              {dataset.data.map((value, i) => {
                const height = (value / maxValue) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-primary-600 rounded-t hover:bg-primary-700 transition-colors relative group"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {data.labels[i]}: {value}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{data.labels[0]}</span>
              <span>{data.labels[Math.floor(data.labels.length / 2)]}</span>
              <span>{data.labels[data.labels.length - 1]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
