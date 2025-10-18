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
} from 'recharts';
import { Card } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

export interface CategoryDataPoint {
  category: string;
  maisQuantity: number;
  fozanQuantity: number;
  totalQuantity: number;
}

interface CategoryChartProps {
  data: CategoryDataPoint[];
  loading?: boolean;
  sortBy?: 'quantity' | 'name';
  onBarClick?: (category: string) => void;
  onExport?: (format: 'png' | 'svg' | 'csv') => void;
}

export const CategoryChart: React.FC<CategoryChartProps> = ({
  data,
  loading = false,
  sortBy: initialSortBy = 'quantity',
  onBarClick,
  onExport,
}) => {
  const t = useTranslations('analytics');
  const [sortBy, setSortBy] = useState<'quantity' | 'name'>(initialSortBy);

  const sortedData = useMemo(() => {
    const sorted = [...data];
    if (sortBy === 'quantity') {
      sorted.sort((a, b) => b.totalQuantity - a.totalQuantity);
    } else {
      sorted.sort((a, b) => a.category.localeCompare(b.category));
    }
    return sorted;
  }, [data, sortBy]);

  const isHorizontal = data.length > 8;

  const handleExport = (format: 'png' | 'svg' | 'csv') => {
    if (onExport) {
      onExport(format);
    } else if (format === 'csv') {
      const csv = [
        ['Category', 'Mais Quantity', 'Fozan Quantity', 'Total Quantity'],
        ...sortedData.map((d) => [d.category, d.maisQuantity, d.fozanQuantity, d.totalQuantity]),
      ]
        .map((row) => row.join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `category-performance-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
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
            {t('charts.category')}
          </h3>
          <div className="flex gap-2">
            {/* Sort Controls */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded p-1">
              <button
                onClick={() => setSortBy('quantity')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  sortBy === 'quantity'
                    ? 'bg-white dark:bg-gray-700 shadow-sm font-medium'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                By Quantity
              </button>
              <button
                onClick={() => setSortBy('name')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  sortBy === 'name'
                    ? 'bg-white dark:bg-gray-700 shadow-sm font-medium'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                By Name
              </button>
            </div>

            {/* Export Buttons */}
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

        {/* Chart */}
        <ResponsiveContainer width="100%" height={isHorizontal ? 500 : 400}>
          <BarChart
            data={sortedData}
            layout={isHorizontal ? 'horizontal' : 'vertical'}
            margin={{ top: 5, right: 30, left: isHorizontal ? 100 : 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            {isHorizontal ? (
              <>
                <XAxis type="number" stroke="#6b7280" className="dark:stroke-gray-400" />
                <YAxis
                  type="category"
                  dataKey="category"
                  stroke="#6b7280"
                  className="dark:stroke-gray-400"
                  width={90}
                  tick={{ fontSize: 12 }}
                />
              </>
            ) : (
              <>
                <XAxis
                  type="category"
                  dataKey="category"
                  stroke="#6b7280"
                  className="dark:stroke-gray-400"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis type="number" stroke="#6b7280" className="dark:stroke-gray-400" />
              </>
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
              formatter={(value: number) => value.toLocaleString()}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar
              dataKey="maisQuantity"
              stackId="a"
              fill="#06b6d4"
              name="Mais"
              onClick={(data: any) => onBarClick && onBarClick(data.category)}
              style={{ cursor: onBarClick ? 'pointer' : 'default' }}
              className="hover:opacity-80 transition-opacity"
            />
            <Bar
              dataKey="fozanQuantity"
              stackId="a"
              fill="#10b981"
              name="Fozan"
              onClick={(data: any) => onBarClick && onBarClick(data.category)}
              style={{ cursor: onBarClick ? 'pointer' : 'default' }}
              className="hover:opacity-80 transition-opacity"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
