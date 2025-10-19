'use client';

import React, { useState, useMemo } from 'react';
import { useLocale } from '@/hooks/useLocale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { useTranslations } from '@/hooks/useTranslations';
import {
  getChartLayout,
  getRechartsRTLConfig,
  formatChartNumber,
  getChartTitleAlign,
  getChartControlsClass
} from '@/utils/analytics-rtl';
import { AccessibleChartWrapper } from '../AccessibleChartWrapper';
import type { TableColumn } from '@/utils/accessibility';
import { downloadCSV } from '@/utils/download-helper';

export interface TrendDataPoint {
  date: string;
  totalQuantity: number;
  maisQuantity: number;
  fozanQuantity: number;
  rejectQuantity: number;
}

interface InventoryTrendChartProps {
  data: TrendDataPoint[];
  loading?: boolean;
  onExport?: (format: 'png' | 'svg' | 'csv') => void;
  onDataPointClick?: (date: string) => void;
}

export const InventoryTrendChart: React.FC<InventoryTrendChartProps> = ({
  data,
  loading = false,
  onExport,
  onDataPointClick,
}) => {
  const t = useTranslations('analytics');
  const locale = useLocale();
  const [visibleLines, setVisibleLines] = useState({
    total: true,
    mais: true,
    fozan: true,
    reject: true,
  });

  // Get RTL configuration
  const chartLayout = getChartLayout(locale);
  const rtlConfig = getRechartsRTLConfig(locale);
  const titleAlign = getChartTitleAlign(locale);
  const controlsClass = getChartControlsClass(locale);

  // Memoize table columns for accessibility
  const tableColumns: TableColumn[] = useMemo(
    () => [
      { key: 'date', label: 'Date' },
      { key: 'totalQuantity', label: 'Total', format: (v) => v.toLocaleString() },
      { key: 'maisQuantity', label: 'Mais', format: (v) => v.toLocaleString() },
      { key: 'fozanQuantity', label: 'Fozan', format: (v) => v.toLocaleString() },
      { key: 'rejectQuantity', label: 'Reject', format: (v) => v.toLocaleString() },
    ],
    []
  );

  const toggleLine = (key: keyof typeof visibleLines) => {
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExport = (format: 'png' | 'svg' | 'csv') => {
    if (onExport) {
      onExport(format);
    } else {
      // Default CSV export
      if (format === 'csv') {
        const csv = [
          ['Date', 'Total', 'Mais', 'Fozan', 'Reject'],
          ...data.map((d) => [
            d.date,
            d.totalQuantity,
            d.maisQuantity,
            d.fozanQuantity,
            d.rejectQuantity,
          ]),
        ]
          .map((row) => row.join(','))
          .join('\n');

        downloadCSV(csv, `inventory-trend-${new Date().toISOString().split('T')[0]}.csv`);
      }
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
      <div className="p-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className={`flex items-center justify-between mb-4 ${controlsClass}`}>
          <h3 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${titleAlign}`}>
            {t('charts.inventoryTrend')}
          </h3>
          <div className={`flex gap-2 ${controlsClass}`}>
            <button
              onClick={() => handleExport('csv')}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={t('export.csv')}
              aria-label="Export chart data as CSV"
            >
              📊 CSV
            </button>
            <button
              onClick={() => handleExport('png')}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={t('export.png')}
              aria-label="Export chart as PNG image"
            >
              🖼️ PNG
            </button>
          </div>
        </div>

        {/* Chart with Accessibility Wrapper */}
        <AccessibleChartWrapper
          chartType="Line"
          data={data}
          columns={tableColumns}
          title={t('charts.inventoryTrend')}
          description="Inventory trend over time showing total, Mais, Fozan, and reject quantities"
          dateRange={
            data.length > 0
              ? { start: data[0].date, end: data[data.length - 1].date }
              : undefined
          }
        >
          <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={chartLayout.margin}>
            <defs>
              <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="maisGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fozanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              tick={{ fontSize: 12, textAnchor: rtlConfig.xAxis.tick.textAnchor }}
              reversed={rtlConfig.xAxis.reversed}
            />
            <YAxis
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              tick={{ fontSize: 12 }}
              orientation={rtlConfig.yAxis.orientation}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
                direction: locale === 'ar' ? 'rtl' : 'ltr',
                textAlign: locale === 'ar' ? 'right' : 'left',
              }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
              formatter={(value: number) => formatChartNumber(value, locale)}
            />
            <Legend
              onClick={(e) => {
                const key = e.dataKey as keyof typeof visibleLines;
                toggleLine(key);
              }}
              wrapperStyle={{
                cursor: 'pointer',
                paddingTop: '20px',
                direction: locale === 'ar' ? 'rtl' : 'ltr',
              }}
              align={rtlConfig.legend.align}
            />

            {visibleLines.total && (
              <Line
                type="monotone"
                dataKey="totalQuantity"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, cursor: onDataPointClick ? 'pointer' : 'default' }}
                activeDot={{ r: 6, cursor: onDataPointClick ? 'pointer' : 'default' }}
                name="Total"
                fill="url(#totalGradient)"
                onClick={(data: any) => {
                  if (onDataPointClick && data?.payload?.date) {
                    onDataPointClick(data.payload.date)
                  }
                }}
              />
            )}
            {visibleLines.mais && (
              <Line
                type="monotone"
                dataKey="maisQuantity"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name="Mais"
                fill="url(#maisGradient)"
              />
            )}
            {visibleLines.fozan && (
              <Line
                type="monotone"
                dataKey="fozanQuantity"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name="Fozan"
                fill="url(#fozanGradient)"
              />
            )}
            {visibleLines.reject && (
              <Line
                type="monotone"
                dataKey="rejectQuantity"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name="Reject"
              />
            )}

            <Brush dataKey="date" height={30} stroke="#3b82f6" />
          </LineChart>
        </ResponsiveContainer>
        </AccessibleChartWrapper>
      </div>
    </Card>
  );
};
