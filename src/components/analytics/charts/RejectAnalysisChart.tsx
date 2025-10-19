'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Line,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { useTranslations } from '@/hooks/useTranslations';
import { downloadCSV } from '@/utils/download-helper';

export interface RejectDataPoint {
  date: string;
  accepted: number;
  rejected: number;
  rejectRate: number;
}

interface RejectAnalysisChartProps {
  data: RejectDataPoint[];
  loading?: boolean;
  viewMode?: 'absolute' | 'percentage';
  onViewModeChange?: (mode: 'absolute' | 'percentage') => void;
  onExport?: (format: 'png' | 'svg' | 'csv') => void;
}

export const RejectAnalysisChart: React.FC<RejectAnalysisChartProps> = ({
  data,
  loading = false,
  viewMode: initialViewMode = 'absolute',
  onViewModeChange,
  onExport,
}) => {
  const t = useTranslations('analytics');
  const [viewMode, setViewMode] = useState<'absolute' | 'percentage'>(initialViewMode);

  const handleViewModeChange = (mode: 'absolute' | 'percentage') => {
    setViewMode(mode);
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
  };

  const handleExport = (format: 'png' | 'svg' | 'csv') => {
    if (onExport) {
      onExport(format);
    } else if (format === 'csv') {
      const csv = [
        ['Date', 'Accepted', 'Rejected', 'Reject Rate (%)'],
        ...data.map((d) => [d.date, d.accepted, d.rejected, d.rejectRate.toFixed(2)]),
      ]
        .map((row) => row.join(','))
        .join('\n');

      downloadCSV(csv, `reject-analysis-${new Date().toISOString().split('T')[0]}.csv`);
    }
  };

  // Calculate trendline using simple linear regression
  const calculateTrendline = () => {
    if (data.length < 2) return [];

    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    data.forEach((point, index) => {
      sumX += index;
      sumY += point.rejectRate;
      sumXY += index * point.rejectRate;
      sumX2 += index * index;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return data.map((point, index) => ({
      date: point.date,
      trend: slope * index + intercept,
    }));
  };

  const trendlineData = calculateTrendline();

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
            {t('charts.rejectAnalysis')}
          </h3>
          <div className="flex gap-2">
            {/* View Mode Toggle */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded p-1">
              <button
                onClick={() => handleViewModeChange('absolute')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  viewMode === 'absolute'
                    ? 'bg-white dark:bg-gray-700 shadow-sm font-medium'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Absolute
              </button>
              <button
                onClick={() => handleViewModeChange('percentage')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  viewMode === 'percentage'
                    ? 'bg-white dark:bg-gray-700 shadow-sm font-medium'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Percentage
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
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="acceptedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="rejectedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              tick={{ fontSize: 12 }}
            />
            <YAxis stroke="#6b7280" className="dark:stroke-gray-400" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'Reject Rate') {
                  return [`${value.toFixed(2)}%`, name];
                }
                return [value.toLocaleString(), name];
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />

            {/* Color-coded zones for reject rate */}
            {viewMode === 'percentage' && (
              <>
                {/* Safe zone: < 5% */}
                <ReferenceLine
                  y={5}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  label={{ value: 'Safe (5%)', position: 'right', fill: '#10b981' }}
                />
                {/* Warning zone: 5-10% */}
                <ReferenceLine
                  y={10}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{ value: 'Warning (10%)', position: 'right', fill: '#f59e0b' }}
                />
              </>
            )}

            {viewMode === 'absolute' ? (
              <>
                <Area
                  type="monotone"
                  dataKey="accepted"
                  stackId="1"
                  stroke="#10b981"
                  fill="url(#acceptedGradient)"
                  name="Accepted"
                />
                <Area
                  type="monotone"
                  dataKey="rejected"
                  stackId="1"
                  stroke="#ef4444"
                  fill="url(#rejectedGradient)"
                  name="Rejected"
                />
              </>
            ) : (
              <Area
                type="monotone"
                dataKey="rejectRate"
                stroke="#ef4444"
                fill="url(#rejectedGradient)"
                name="Reject Rate"
              />
            )}

            {/* Trendline for percentage view */}
            {viewMode === 'percentage' && trendlineData.length > 0 && (
              <Line
                data={trendlineData}
                type="monotone"
                dataKey="trend"
                stroke="#6b7280"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Trend"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend for color zones */}
        {viewMode === 'percentage' && (
          <div className="mt-4 flex gap-4 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>Safe (&lt; 5%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded" />
              <span>Warning (5-10%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span>Danger (&gt; 10%)</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
