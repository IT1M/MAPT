'use client';

import React, { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Destination } from '@prisma/client';
import type { InventoryItemWithUser } from '@/types';

interface BulkEditDestinationModalProps {
  items: InventoryItemWithUser[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkEditDestinationModal({
  items,
  isOpen,
  onClose,
  onSuccess,
}: BulkEditDestinationModalProps) {
  const t = useTranslations();
  const [destination, setDestination] = useState<Destination>(Destination.MAIS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/inventory/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: items.map((item) => item.id),
          updates: {
            destination,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error?.message || 'Failed to update destinations'
        );
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Bulk update error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  // Count items by current destination
  const destinationCounts = items.reduce(
    (acc, item) => {
      acc[item.destination] = (acc[item.destination] || 0) + 1;
      return acc;
    },
    {} as Record<Destination, number>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('dataLog.bulkEditDestination')}
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
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
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                {t('dataLog.bulkEditInfo', { count: items.length })}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {t('dataLog.bulkEditDescription')}
              </p>
            </div>
          </div>
        </div>

        {/* Current Distribution */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {t('dataLog.currentDistribution')}
          </h4>
          <div className="space-y-2">
            {Object.entries(destinationCounts).map(([dest, count]) => (
              <div
                key={dest}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      dest === Destination.MAIS
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}
                  >
                    {dest}
                  </span>
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {count} {count === 1 ? 'item' : 'items'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Destination Selection */}
        <div>
          <Select
            label={t('dataLog.newDestination')}
            name="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value as Destination)}
            disabled={loading}
            required
            options={[
              { value: Destination.MAIS, label: 'MAIS' },
              { value: Destination.FOZAN, label: 'FOZAN' },
            ]}
          />
        </div>

        {/* Items Preview */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {t('dataLog.itemsToUpdate')}
          </h4>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {items.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between py-1"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.itemName}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    ({item.batch})
                  </span>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    item.destination === Destination.MAIS
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}
                >
                  {item.destination}
                </span>
              </div>
            ))}
            {items.length > 10 && (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic pt-2">
                {t('dataLog.andMore', { count: items.length - 10 })}
              </div>
            )}
          </div>
        </div>

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
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            loading={loading}
          >
            {t('dataLog.updateDestinations', { count: items.length })}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
