'use client';

import React, { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import type { InventoryItemWithUser } from '@/types';

interface BulkDeleteModalProps {
  items: InventoryItemWithUser[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface BulkDeleteResult {
  successful: number;
  failed: number;
  errors: string[];
}

export function BulkDeleteModal({
  items,
  isOpen,
  onClose,
  onSuccess,
}: BulkDeleteModalProps) {
  const t = useTranslations();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<BulkDeleteResult | null>(null);

  const isConfirmed = confirmText === 'DELETE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConfirmed) {
      setError('Please type DELETE to confirm');
      return;
    }

    setError(null);
    setLoading(true);
    setProgress(0);
    setResult(null);

    try {
      const response = await fetch('/api/inventory/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: items.map((item) => item.id),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to delete items');
      }

      setProgress(100);
      setResult({
        successful: data.data.deletedCount || 0,
        failed: data.data.failedCount || 0,
        errors: data.data.errors || [],
      });

      // If all successful, close after a short delay
      if (data.data.failedCount === 0) {
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Bulk delete error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setConfirmText('');
      setError(null);
      setProgress(0);
      setResult(null);
      onClose();
    }
  };

  // Calculate total quantity
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Delete Items"
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warning Icon */}
        <div className="flex items-center justify-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Warning Message */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Delete {items.length} {items.length === 1 ? 'Item' : 'Items'}?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This action cannot be undone. The items will be permanently removed
            from the system.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Items to delete:
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {items.length}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Total quantity:
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {totalQuantity.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Items to be deleted:
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {items.slice(0, 20).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 text-sm bg-white dark:bg-gray-900 rounded p-2"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {item.itemName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span className="font-mono">{item.batch}</span>
                    <span>•</span>
                    <span>Qty: {item.quantity.toLocaleString()}</span>
                    <span>•</span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                        item.destination === 'MAIS'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}
                    >
                      {item.destination}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {items.length > 20 && (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic text-center pt-2">
                and {items.length - 20} more items...
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Input */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                Confirm Deletion
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                Type <span className="font-mono font-bold">DELETE</span> in the
                box below to confirm this action.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE to confirm"
                className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-gray-100 font-mono"
                disabled={loading}
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {loading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                Deleting items...
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Result Summary */}
        {result && (
          <div
            className={`rounded-lg p-4 ${
              result.failed === 0
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <svg
                className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  result.failed === 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    result.failed === 0
                      ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                      : 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                  }
                />
              </svg>
              <div className="flex-1">
                <p
                  className={`text-sm font-medium mb-1 ${
                    result.failed === 0
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-yellow-900 dark:text-yellow-100'
                  }`}
                >
                  {result.failed === 0
                    ? `Successfully deleted ${result.successful} ${result.successful === 1 ? 'item' : 'items'}`
                    : `Deleted ${result.successful} items, ${result.failed} failed`}
                </p>
                {result.errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {result.errors.slice(0, 5).map((error, idx) => (
                      <p
                        key={idx}
                        className="text-xs text-yellow-700 dark:text-yellow-300"
                      >
                        • {error}
                      </p>
                    ))}
                    {result.errors.length > 5 && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 italic">
                        and {result.errors.length - 5} more errors...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
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
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              type="submit"
              variant="danger"
              disabled={loading || !isConfirmed}
              loading={loading}
            >
              Delete {items.length} {items.length === 1 ? 'Item' : 'Items'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
