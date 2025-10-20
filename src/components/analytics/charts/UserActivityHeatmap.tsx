'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useTranslations } from '@/hooks/useTranslations';
import { downloadCSV } from '@/utils/download-helper';

export interface HeatmapDataPoint {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  count: number;
}

interface UserActivityHeatmapProps {
  data: HeatmapDataPoint[];
  loading?: boolean;
  onExport?: (format: 'png' | 'svg' | 'csv') => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const UserActivityHeatmap: React.FC<UserActivityHeatmapProps> = ({
  data,
  loading = false,
  onExport,
}) => {
  const t = useTranslations('analytics');

  // Create a map for quick lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((point) => {
      const key = `${point.dayOfWeek}-${point.hour}`;
      map.set(key, point.count);
    });
    return map;
  }, [data]);

  // Find max count for color scaling
  const maxCount = useMemo(() => {
    return Math.max(...data.map((d) => d.count), 1);
  }, [data]);

  // Get color intensity based on count
  const getColor = (count: number): string => {
    if (count === 0) return 'rgb(243, 244, 246)'; // gray-100
    const intensity = count / maxCount;

    if (intensity < 0.2) return 'rgb(219, 234, 254)'; // blue-100
    if (intensity < 0.4) return 'rgb(191, 219, 254)'; // blue-200
    if (intensity < 0.6) return 'rgb(147, 197, 253)'; // blue-300
    if (intensity < 0.8) return 'rgb(96, 165, 250)'; // blue-400
    return 'rgb(59, 130, 246)'; // blue-500
  };

  const getDarkColor = (count: number): string => {
    if (count === 0) return 'rgb(31, 41, 55)'; // gray-800
    const intensity = count / maxCount;

    if (intensity < 0.2) return 'rgb(30, 58, 138)'; // blue-900
    if (intensity < 0.4) return 'rgb(30, 64, 175)'; // blue-800
    if (intensity < 0.6) return 'rgb(29, 78, 216)'; // blue-700
    if (intensity < 0.8) return 'rgb(37, 99, 235)'; // blue-600
    return 'rgb(59, 130, 246)'; // blue-500
  };

  const handleExport = (format: 'png' | 'svg' | 'csv') => {
    if (onExport) {
      onExport(format);
    } else if (format === 'csv') {
      const csv = [
        ['Day', 'Hour', 'Count'],
        ...data.map((d) => [DAYS[d.dayOfWeek], d.hour, d.count]),
      ]
        .map((row) => row.join(','))
        .join('\n');

      downloadCSV(
        csv,
        `user-activity-heatmap-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
          <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </Card>
    );
  }

  const cellSize = 24;
  const cellGap = 2;
  const labelWidth = 40;
  const labelHeight = 30;
  const chartWidth = HOURS.length * (cellSize + cellGap) + labelWidth;
  const chartHeight = DAYS.length * (cellSize + cellGap) + labelHeight;

  return (
    <Card>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('charts.userActivity')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Entry activity by day and hour
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title={t('export.csv')}
            >
              📊 CSV
            </button>
          </div>
        </div>

        {/* Heatmap */}
        <div className="overflow-x-auto">
          <svg
            width={chartWidth}
            height={chartHeight}
            className="mx-auto"
            role="img"
            aria-label="User activity heatmap showing entry patterns by day and hour"
          >
            {/* Hour labels (top) */}
            {HOURS.map((hour) => (
              <text
                key={`hour-${hour}`}
                x={labelWidth + hour * (cellSize + cellGap) + cellSize / 2}
                y={labelHeight - 10}
                textAnchor="middle"
                className="text-xs fill-gray-600 dark:fill-gray-400"
                fontSize="10"
              >
                {hour % 3 === 0 ? `${hour}h` : ''}
              </text>
            ))}

            {/* Day labels (left) and cells */}
            {DAYS.map((day, dayIndex) => (
              <g key={`day-${dayIndex}`}>
                {/* Day label */}
                <text
                  x={labelWidth - 10}
                  y={
                    labelHeight +
                    dayIndex * (cellSize + cellGap) +
                    cellSize / 2 +
                    4
                  }
                  textAnchor="end"
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                  fontSize="11"
                >
                  {day}
                </text>

                {/* Hour cells */}
                {HOURS.map((hour) => {
                  const key = `${dayIndex}-${hour}`;
                  const count = dataMap.get(key) || 0;
                  const isPeak = count === maxCount && count > 0;

                  return (
                    <g key={`cell-${key}`}>
                      <rect
                        x={labelWidth + hour * (cellSize + cellGap)}
                        y={labelHeight + dayIndex * (cellSize + cellGap)}
                        width={cellSize}
                        height={cellSize}
                        className="dark:hidden"
                        fill={getColor(count)}
                        stroke={isPeak ? '#ef4444' : '#e5e7eb'}
                        strokeWidth={isPeak ? 2 : 1}
                        rx={2}
                      >
                        <title>{`${day} ${hour}:00 - ${count} entries${isPeak ? ' (Peak)' : ''}`}</title>
                      </rect>
                      <rect
                        x={labelWidth + hour * (cellSize + cellGap)}
                        y={labelHeight + dayIndex * (cellSize + cellGap)}
                        width={cellSize}
                        height={cellSize}
                        className="hidden dark:block"
                        fill={getDarkColor(count)}
                        stroke={isPeak ? '#ef4444' : '#374151'}
                        strokeWidth={isPeak ? 2 : 1}
                        rx={2}
                      >
                        <title>{`${day} ${hour}:00 - ${count} entries${isPeak ? ' (Peak)' : ''}`}</title>
                      </rect>
                    </g>
                  );
                })}
              </g>
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <span className="text-xs text-gray-500 dark:text-gray-400">Less</span>
          <div className="flex gap-1">
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity, idx) => (
              <div
                key={idx}
                className="w-6 h-6 rounded dark:hidden"
                style={{ backgroundColor: getColor(intensity * maxCount) }}
                title={`${Math.round(intensity * 100)}% of max activity`}
              />
            ))}
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity, idx) => (
              <div
                key={idx}
                className="w-6 h-6 rounded hidden dark:block"
                style={{ backgroundColor: getDarkColor(intensity * maxCount) }}
                title={`${Math.round(intensity * 100)}% of max activity`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">More</span>
          <div className="ml-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-red-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Peak time
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {data.reduce((sum, d) => sum + d.count, 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Total Entries
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {maxCount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Peak Hour
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
