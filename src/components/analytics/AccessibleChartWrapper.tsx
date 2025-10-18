'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  getChartAriaLabel,
  handleKeyboardNavigation,
  ScreenReaderAnnouncer,
  generateDataTable,
  type TableColumn,
} from '@/utils/accessibility';

interface AccessibleChartWrapperProps {
  children: React.ReactNode;
  chartType: string;
  data: any[];
  columns: TableColumn[];
  dateRange?: { start: string; end: string };
  title: string;
  description?: string;
  onDataPointFocus?: (index: number) => void;
}

export const AccessibleChartWrapper: React.FC<AccessibleChartWrapperProps> = ({
  children,
  chartType,
  data,
  columns,
  dateRange,
  title,
  description,
  onDataPointFocus,
}) => {
  const [showDataTable, setShowDataTable] = useState(false);
  const [focusedDataPoint, setFocusedDataPoint] = useState<number>(0);
  const chartRef = useRef<HTMLDivElement>(null);
  const announcer = ScreenReaderAnnouncer.getInstance();

  const ariaLabel = getChartAriaLabel(chartType, data.length, dateRange);

  useEffect(() => {
    // Announce when data updates
    if (data.length > 0) {
      announcer.announceDataUpdate(chartType, data.length);
    }
  }, [data.length, chartType, announcer]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    handleKeyboardNavigation(event, {
      onArrowLeft: () => {
        const newIndex = Math.max(0, focusedDataPoint - 1);
        setFocusedDataPoint(newIndex);
        onDataPointFocus?.(newIndex);
        announcer.announce(
          `Data point ${newIndex + 1} of ${data.length}: ${formatDataPoint(data[newIndex])}`,
          'polite'
        );
      },
      onArrowRight: () => {
        const newIndex = Math.min(data.length - 1, focusedDataPoint + 1);
        setFocusedDataPoint(newIndex);
        onDataPointFocus?.(newIndex);
        announcer.announce(
          `Data point ${newIndex + 1} of ${data.length}: ${formatDataPoint(data[newIndex])}`,
          'polite'
        );
      },
      onEscape: () => {
        chartRef.current?.blur();
        announcer.announce('Exited chart navigation', 'polite');
      },
    });
  };

  const formatDataPoint = (dataPoint: any): string => {
    return columns
      .map((col) => {
        const value = dataPoint[col.key];
        const formatted = col.format ? col.format(value) : String(value);
        return `${col.label}: ${formatted}`;
      })
      .join(', ');
  };

  const toggleDataTable = () => {
    setShowDataTable(!showDataTable);
    announcer.announce(
      showDataTable ? 'Showing chart view' : 'Showing data table view',
      'polite'
    );
  };

  return (
    <div className="relative">
      {/* Accessibility Controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="sr-only" id={`${chartType}-description`}>
          {description || `${title} visualization`}
        </div>
        <button
          onClick={toggleDataTable}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          aria-label={showDataTable ? 'Show chart view' : 'Show data table view'}
        >
          {showDataTable ? '📊 Show Chart' : '📋 Show Data Table'}
        </button>
      </div>

      {/* Chart or Table View */}
      {showDataTable ? (
        <DataTableView data={data} columns={columns} title={title} />
      ) : (
        <div
          ref={chartRef}
          role="img"
          aria-label={ariaLabel}
          aria-describedby={`${chartType}-description`}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
        >
          {children}
        </div>
      )}

      {/* Screen Reader Only Instructions */}
      <div className="sr-only">
        <p>
          Use left and right arrow keys to navigate through data points.
          Press Escape to exit chart navigation.
          Press the &quot;Show Data Table&quot; button to view data in an accessible table format.
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// Data Table View Component
// ============================================================================

interface DataTableViewProps {
  data: any[];
  columns: TableColumn[];
  title: string;
}

const DataTableView: React.FC<DataTableViewProps> = ({ data, columns, title }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <caption className="sr-only">{title} data table</caption>
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              {columns.map((column) => {
                const value = row[column.key];
                const formatted = column.format ? column.format(value) : String(value);
                return (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                  >
                    {formatted}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
