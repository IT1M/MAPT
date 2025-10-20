'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import type { AuditHistoryEntry } from '@/types';

interface AuditHistoryModalProps {
  itemId: string | null;
  itemName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AuditHistoryModal({
  itemId,
  itemName,
  isOpen,
  onClose,
}: AuditHistoryModalProps) {
  const t = useTranslations();
  const [entries, setEntries] = useState<AuditHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    if (isOpen && itemId) {
      fetchAuditHistory();
    } else {
      // Reset state when modal closes
      setEntries([]);
      setPage(1);
      setError(null);
    }
  }, [isOpen, itemId, page]);

  const fetchAuditHistory = async () => {
    if (!itemId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/inventory/${itemId}/audit-history?page=${page}&pageSize=${pageSize}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch audit history');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setEntries(result.data.entries || []);
        setTotal(result.data.pagination?.total || 0);
        setTotalPages(result.data.pagination?.totalPages || 1);
      } else {
        throw new Error(
          result.error?.message || 'Failed to load audit history'
        );
      }
    } catch (err) {
      console.error('Error fetching audit history:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en', { month: 'short' });
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        );
      case 'UPDATE':
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        );
      case 'DELETE':
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getActionLabel = (action: string): string => {
    switch (action) {
      case 'CREATE':
        return 'Created';
      case 'UPDATE':
        return 'Updated';
      case 'DELETE':
        return 'Deleted';
      default:
        return action;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        itemName
          ? `${t('dataLog.auditHistory')} - ${itemName}`
          : t('dataLog.auditHistory')
      }
      size="large"
    >
      <div className="space-y-4">
        {/* Loading State */}
        {loading && entries.length === 0 && (
          <div className="space-y-4">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <Button variant="primary" size="small" onClick={fetchAuditHistory}>
              {t('common.retry')}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && entries.length === 0 && (
          <div className="text-center py-8">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('dataLog.noAuditHistory')}
            </p>
          </div>
        )}

        {/* Timeline */}
        {!loading && !error && entries.length > 0 && (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

            {/* Timeline entries */}
            <div className="space-y-6">
              {entries.map((entry, index) => (
                <div key={entry.id} className="relative flex items-start gap-4">
                  {/* Timeline dot */}
                  <div
                    className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${getActionColor(
                      entry.action
                    )}`}
                  >
                    {getActionIcon(entry.action)}
                  </div>

                  {/* Entry content */}
                  <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(
                            entry.action
                          )}`}
                        >
                          {getActionLabel(entry.action)}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {entry.user.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({entry.user.role})
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>

                    {/* Field changes */}
                    {entry.changes && entry.changes.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                          Changes:
                        </div>
                        {entry.changes.map((change, idx) => (
                          <div
                            key={idx}
                            className="text-sm bg-white dark:bg-gray-900 rounded p-2"
                          >
                            <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {change.field}
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded line-through">
                                {String(change.oldValue)}
                              </span>
                              <svg
                                className="w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                                />
                              </svg>
                              <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                                {String(change.newValue)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Additional metadata */}
                    {(entry.ipAddress || entry.userAgent) && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          {entry.ipAddress && <div>IP: {entry.ipAddress}</div>}
                          {entry.userAgent && (
                            <div className="truncate" title={entry.userAgent}>
                              User Agent: {entry.userAgent}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, total)} of {total} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => setPage(page - 1)}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300 px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
