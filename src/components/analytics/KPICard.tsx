'use client';

import React, { useMemo } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { Card } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { getKPICardLayoutClass, getIconTransform } from '@/utils/analytics-rtl';
import { getKPIAriaLabel, handleKeyboardNavigation, ScreenReaderAnnouncer } from '@/utils/accessibility';

export interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    label: string;
  };
  sparklineData?: number[];
  color?: 'primary' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
  loading?: boolean;
}

const colorClasses = {
  primary: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
    value: 'text-blue-900 dark:text-blue-100',
    trend: 'text-blue-600 dark:text-blue-400',
    line: '#3b82f6',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'text-green-600 dark:text-green-400',
    value: 'text-green-900 dark:text-green-100',
    trend: 'text-green-600 dark:text-green-400',
    line: '#10b981',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    icon: 'text-yellow-600 dark:text-yellow-400',
    value: 'text-yellow-900 dark:text-yellow-100',
    trend: 'text-yellow-600 dark:text-yellow-400',
    line: '#f59e0b',
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'text-red-600 dark:text-red-400',
    value: 'text-red-900 dark:text-red-100',
    trend: 'text-red-600 dark:text-red-400',
    line: '#ef4444',
  },
};

const trendIcons = {
  up: '↑',
  down: '↓',
  stable: '→',
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  sparklineData,
  color = 'primary',
  onClick,
  loading = false,
}) => {
  const locale = useLocale();
  const colors = colorClasses[color];
  const isClickable = !!onClick;
  const layoutClass = getKPICardLayoutClass(locale);
  const announcer = ScreenReaderAnnouncer.getInstance();

  // Memoize aria label for performance
  const ariaLabel = useMemo(
    () => getKPIAriaLabel(title, value, trend),
    [title, value, trend]
  );

  const handleClick = () => {
    if (onClick) {
      onClick();
      announcer.announceFilterChange('KPI', title);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isClickable) return;

    handleKeyboardNavigation(event, {
      onEnter: handleClick,
      onSpace: handleClick,
    });
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-16 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      hover={isClickable}
      className={`transition-all duration-200 ${
        isClickable ? 'cursor-pointer' : ''
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      aria-label={ariaLabel}
    >
      <div className="p-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className={`flex items-start justify-between mb-4 ${layoutClass}`}>
          {/* Icon */}
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <div className={`text-2xl ${colors.icon}`}>{icon}</div>
          </div>

          {/* Sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="h-16 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData.map((val, idx) => ({ value: val, index: idx }))}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={colors.line}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Value */}
        <div className={`text-3xl font-bold mb-1 ${colors.value}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>

        {/* Title */}
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          {title}
        </div>

        {/* Subtitle and Trend */}
        <div className={`flex items-center justify-between ${layoutClass}`}>
          {subtitle && (
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {subtitle}
            </div>
          )}

          {trend && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                trend.direction === 'up'
                  ? 'text-green-600 dark:text-green-400'
                  : trend.direction === 'down'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
              style={{ transform: getIconTransform(locale, 'trend') }}
            >
              <span className="text-base">{trendIcons[trend.direction]}</span>
              <span>{trend.percentage.toFixed(1)}%</span>
              <span className="text-gray-500 dark:text-gray-500">
                {trend.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
