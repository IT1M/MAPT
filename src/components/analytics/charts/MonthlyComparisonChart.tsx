'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

export interface MonthlyDataPoint {
  month: string; // YYYY-MM
  quantity: number;
  items: number;
  rejectRate: number;
}

interface MonthlyComparisonChartProps {
  data: MonthlyDataPoint[];
  loading?: boolean;
  selectedMonths?: string[];
  metric?: 'quantity' | 'items' | 'rejectRate';
  onMetricChange?: (metric: 'quantity' | 'items' | 'rejectRate') => void;
  onExport?: (format: 'png' | 'svg' | 'csv') => void;
}

export const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({
  data,
  loading = false,
  selectedMonths: initialSelectedMonths,
  metric: initialMetric = 'quantity',
  onMetricChange,
  onExport,
}) => {
  const t = useTranslations('analytics');
  const [metric, setMetric] = useState<'quantity' | 'items' | 'rejectRate'>(initialMetric);
  const [selectedMonths, setSelectedMonths] = useState<string[]>(
    initialSelectedMonths || data.slice(-6).map((d) => d.month)
  );

  // Format month for display
  const formatMonth = (monthStr: string): string => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Get current month
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Filter data based on selected months
  const filteredData = useMemo(() => {
    return data
      .filter((d) => selectedMonths.includes(d.month))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [data, selectedMonths]);

  // Transform data for the chart
  const chartData = useMemo(() => {
    return filteredData.map((d) => ({
      month: formatMonth(d.month),
      value: metric === 'quantity' ? d.quantity : metric === 'items' ? d.items : d.rejectRate,
      isCurrentMonth: d.month === currentMonth,
      rawMonth: d.month,
    }));
  }, [filteredData, metric, currentMonth]);

  const handleMetricChange = (newMetric: 'quantity' | 'items' | 'rejectRate') => {
    setMetric(newMetric);
    if (onMetricChange) {
      onMetricChange(newMetric);
    }
  };

  const toggleMonth = (month: string) => {
    setSelectedMonths((prev) => {
      if (prev.includes(month)) {
        // Keep at least one month selected
        if (prev.length === 1) return prev;
        return prev.filter((m) => m !== month);
      } else {
        return [...prev, month].sort();
      }
    });
  };

  const handleExport = (format: 'png' | 'svg' | 'csv') => {
    if (onExport) {
      onExport(format);
    } else if (format === 'csv') {
      const csv = [
        ['Month', 'Quantity', 'Items', 'Reject Rate (%)'],
        ...filteredData.map((d) => [formatMonth(d.month), d.quantity, d.items, d.rejectRate]),
      ]
        .map((row) => row.join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monthly-comparison-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getMetricLabel = () => {
    switch (metric) {
      case 'quantity':
        return 'Total Quantity';
      case 'items':
        return 'Item Count';
      case 'rejectRate':
        return 'Reject Rate (%)';
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
          <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('charts.monthlyComparison')}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title={t('export.csv')}
            >
              📊 CSV
            </button>
            <button
              onClick={() => handleExport('png')}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title={t('export.png')}
            >
              🖼️ PNG
            </button>
          </div>
        </div>

        {/* Metric Toggle */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Metric
          </label>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded p-1 inline-flex">
            <button
              onClick={() => handleMetricChange('quantity')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                metric === 'quantity'
                  ? 'bg-white dark:bg-gray-700 shadow-sm font-medium text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Quantity
            </button>
            <button
              onClick={() => handleMetricChange('items')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                metric === 'items'
                  ? 'bg-white dark:bg-gray-700 shadow-sm font-medium text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Item Count
            </button>
            <button
              onClick={() => handleMetricChange('rejectRate')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                metric === 'rejectRate'
                  ? 'bg-white dark:bg-gray-700 shadow-sm font-medium text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Reject Rate
            </button>
          </div>
        </div>

        {/* Month Selector */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Select Months to Compare
          </label>
          <div className="flex flex-wrap gap-2">
            {data.slice(-12).map((d) => {
              const isSelected = selectedMonths.includes(d.month);
              const isCurrent = d.month === currentMonth;
              return (
                <button
                  key={d.month}
                  onClick={() => toggleMonth(d.month)}
                  className={`px-3 py-1.5 text-sm rounded-lg border-2 transition-all ${
                    isSelected
                      ? isCurrent
                        ? 'bg-blue-500 border-blue-500 text-white font-medium shadow-md'
                        : 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300 font-medium'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  {formatMonth(d.month)}
                  {isCurrent && ' (Current)'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              tick={{ fontSize: 12 }}
              label={{
                value: getMetricLabel(),
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12, fill: '#6b7280' },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
              formatter={(value: number) => [
                metric === 'rejectRate' ? `${value.toFixed(2)}%` : value.toLocaleString(),
                getMetricLabel(),
              ]}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar
              dataKey="value"
              name={getMetricLabel()}
              radius={[8, 8, 0, 0]}
              className="hover:opacity-80 transition-opacity"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isCurrentMonth ? '#3b82f6' : '#93c5fd'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Comparison Summary */}
        {chartData.length >= 2 && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Comparison: </span>
              {(() => {
                const values = chartData.map((d) => d.value);
                const latest = values[values.length - 1];
                const previous = values[values.length - 2];
                const change = ((latest - previous) / previous) * 100;
                const isPositive = change > 0;
                const isGood =
                  metric === 'rejectRate' ? !isPositive : isPositive;

                return (
                  <>
                    Latest month is{' '}
                    <span
                      className={`font-bold ${
                        isGood
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {Math.abs(change).toFixed(1)}% {isPositive ? 'higher' : 'lower'}
                    </span>{' '}
                    than the previous month
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
