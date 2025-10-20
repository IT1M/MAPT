'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export interface TableLoadingStateProps {
  columns: number;
  rows?: number;
  hasSelection?: boolean;
  className?: string;
}

export const TableLoadingState: React.FC<TableLoadingStateProps> = ({
  columns,
  rows = 5,
  hasSelection = false,
  className = '',
}) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {hasSelection && (
                  <th className="px-3 py-3.5 w-12">
                    <Skeleton width={16} height={16} variant="rectangular" />
                  </th>
                )}
                {Array.from({ length: columns }).map((_, idx) => (
                  <th key={idx} className="px-3 py-3.5">
                    <Skeleton width="80%" height={16} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {Array.from({ length: rows }).map((_, rowIdx) => (
                <tr key={rowIdx}>
                  {hasSelection && (
                    <td className="px-3 py-4 w-12">
                      <Skeleton width={16} height={16} variant="rectangular" />
                    </td>
                  )}
                  {Array.from({ length: columns }).map((_, colIdx) => (
                    <td key={colIdx} className="px-3 py-4">
                      <Skeleton
                        width={
                          colIdx === 0
                            ? '90%'
                            : colIdx % 3 === 0
                              ? '60%'
                              : '75%'
                        }
                        height={16}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
