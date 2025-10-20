'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Destination } from '@prisma/client';

export interface QuickStatsEntry {
  id: string;
  itemName: string;
  batch: string;
  quantity: number;
  destination: Destination;
  createdAt: Date;
}

export interface QuickStatsWidgetProps {
  todayCount: number;
  recentEntries: QuickStatsEntry[];
  onRefresh?: () => void;
}

export const QuickStatsWidget = React.memo<QuickStatsWidgetProps>(
  function QuickStatsWidget({ todayCount, recentEntries, onRefresh }) {
    const [copiedBatch, setCopiedBatch] = useState<string | null>(null);

    // Memoize destination breakdown calculation
    const destinationSummary = useMemo(() => {
      return recentEntries.reduce(
        (acc, entry) => {
          acc[entry.destination] = (acc[entry.destination] || 0) + 1;
          return acc;
        },
        { MAIS: 0, FOZAN: 0 } as Record<Destination, number>
      );
    }, [recentEntries]);

    // Memoize copy handler
    const handleCopyBatch = useCallback(async (batch: string) => {
      try {
        await navigator.clipboard.writeText(batch);
        setCopiedBatch(batch);
        setTimeout(() => setCopiedBatch(null), 2000);
      } catch (error) {
        console.error('Failed to copy batch number:', error);
      }
    }, []);

    // Memoize time formatter
    const formatTime = useCallback((date: Date) => {
      const d = new Date(date);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }, []);

    return (
      <aside
        className="hidden lg:block w-80 flex-shrink-0"
        role="complementary"
        aria-label="Quick statistics sidebar"
      >
        <Card className="sticky top-4">
          <Card.Header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Quick Stats
            </h2>
            {onRefresh && (
              <Button
                variant="secondary"
                size="small"
                onClick={onRefresh}
                className="!p-2"
                aria-label="Refresh stats"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </Button>
            )}
          </Card.Header>

          <Card.Body className="space-y-6">
            {/* Today's Entry Count */}
            <section aria-labelledby="today-count-heading">
              <h3
                id="today-count-heading"
                className="text-sm text-gray-600 dark:text-gray-400 mb-1"
              >
                Today&apos;s Entries
              </h3>
              <p
                className="text-3xl font-bold text-primary-600 dark:text-primary-400"
                aria-live="polite"
              >
                {todayCount}
              </p>
            </section>

            {/* Destination Breakdown */}
            <section aria-labelledby="destinations-heading">
              <h3
                id="destinations-heading"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Destinations
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    MAIS
                  </span>
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                    {destinationSummary.MAIS}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span className="text-sm font-medium text-green-900 dark:text-green-200">
                    FOZAN
                  </span>
                  <span className="text-sm font-bold text-green-700 dark:text-green-300">
                    {destinationSummary.FOZAN}
                  </span>
                </div>
              </div>
            </section>

            {/* Recent Entries */}
            <section aria-labelledby="recent-items-heading">
              <h3
                id="recent-items-heading"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Recent Items
              </h3>
              {recentEntries.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No entries yet
                </p>
              ) : (
                <div className="space-y-2">
                  {recentEntries.slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                          {entry.itemName}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            entry.destination === 'MAIS'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                          }`}
                        >
                          {entry.destination}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyBatch(entry.batch)}
                        className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group"
                        title="Click to copy batch number"
                      >
                        <span className="font-mono">{entry.batch}</span>
                        {copiedBatch === entry.batch ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </button>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Qty: {entry.quantity}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(entry.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </Card.Body>
        </Card>
      </aside>
    );
  }
);
