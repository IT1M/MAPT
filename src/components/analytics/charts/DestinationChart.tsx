'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { 
  formatChartNumber, 
  getChartTitleAlign, 
  getChartControlsClass,
  getLegendConfig 
} from '@/utils/analytics-rtl';

export interface DestinationData {
  MAIS: { quantity: number; items: number };
  FOZAN: { quantity: number; items: number };
}

interface DestinationChartProps {
  data: DestinationData;
  loading?: boolean;
  onSegmentClick?: (destination: 'MAIS' | 'FOZAN') => void;
  onExport?: (format: 'png' | 'svg' | 'csv') => void;
}

const COLORS = {
  MAIS: '#06b6d4',
  FOZAN: '#10b981',
};

export const DestinationChart: React.FC<DestinationChartProps> = ({
  data,
  loading = false,
  onSegmentClick,
  onExport,
}) => {
  const t = useTranslations('analytics');
  const locale = useLocale();
  const titleAlign = getChartTitleAlign(locale);
  const controlsClass = getChartControlsClass(locale);
  const legendConfig = getLegendConfig(locale);

  const chartData = [
    {
      name: 'Mais',
      value: data.MAIS.quantity,
      items: data.MAIS.items,
      destination: 'MAIS' as const,
    },
    {
      name: 'Fozan',
      value: data.FOZAN.quantity,
      items: data.FOZAN.items,
      destination: 'FOZAN' as const,
    },
  ];

  const total = data.MAIS.quantity + data.FOZAN.quantity;

  const handleExport = (format: 'png' | 'svg' | 'csv') => {
    if (onExport) {
      onExport(format);
    } else if (format === 'csv') {
      const csv = [
        ['Destination', 'Quantity', 'Items', 'Percentage'],
        ...chartData.map((d) => [
          d.name,
          d.value,
          d.items,
          `${((d.value / total) * 100).toFixed(1)}%`,
        ]),
      ]
        .map((row) => row.join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `destination-distribution-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-bold text-sm"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
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
            {t('charts.destination')}
          </h3>
          <div className={`flex gap-2 ${controlsClass}`}>
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
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              onClick={(entry) => {
                if (onSegmentClick) {
                  onSegmentClick(entry.destination);
                }
              }}
              style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.destination]}
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
                direction: locale === 'ar' ? 'rtl' : 'ltr',
                textAlign: locale === 'ar' ? 'right' : 'left',
              }}
              formatter={(value: number, name: string, props: any) => [
                `${formatChartNumber(value, locale)} (${props.payload.items} items)`,
                name,
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              align={legendConfig.align}
              wrapperStyle={legendConfig.wrapperStyle}
              formatter={(value, entry: any) => {
                const percentage = ((entry.payload.value / total) * 100).toFixed(1);
                return `${value}: ${formatChartNumber(entry.payload.value, locale)} (${percentage}%)`;
              }}
            />
            {/* Center label */}
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-gray-600 dark:fill-gray-400 text-sm font-medium"
            >
              <tspan x="50%" dy="-0.5em" className="text-2xl font-bold">
                {total.toLocaleString()}
              </tspan>
              <tspan x="50%" dy="1.5em" className="text-xs">
                Total Items
              </tspan>
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
