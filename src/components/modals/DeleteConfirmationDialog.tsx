'use client';

import React, { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import type { InventoryItemWithUser } from '@/types';

interface DeleteConfirmationDialogProps {
  item: InventoryItemWithUser | null;
  items?: InventoryItemWithUser[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isBulk?: boolean;
}

export function DeleteConfirmationDialog({
  item,
  items = [],
  isOpen,
  onClose,
  onConfirm,
  isBulk = false,
}: DeleteConfirmationDialogProps) {
  const t = useTranslations();
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const itemCount = isBulk ? items.length : 1;

  const handleConfirm = async () => {
    if (!confirmed) return;

    setLoading(true);
    try {
      await onConfirm();
      setConfirmed(false);
      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setConfirmed(false);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isBulk ? t('dataLog.bulkDelete') : t('dataLog.deleteItem')}
      size="small"
    >
      <div className="space-y-4">
        {/* Warning Icon */}
        <div className="flex items-center justify-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400"
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
            {isBulk
              ? t('dataLog.confirmBulkDelete', { count: itemCount })
              : t('dataLog.confirmDelete')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('dataLog.deleteWarning')}
          </p>
        </div>

        {/* Item Details */}
        {!isBulk && item && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {t('inventory.itemName')}:
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {item.itemName}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {t('inventory.batch')}:
              </span>
              <span className="font-mono text-gray-900 dark:text-gray-100">
                {item.batch}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {t('common.quantity')}:
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {item.quantity.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Bulk Items Summary */}
        {isBulk && items.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t('dataLog.itemsToDelete')}:
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {items.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="font-medium">{item.itemName}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    ({item.batch})
                  </span>
                </div>
              ))}
              {items.length > 10 && (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                  {t('dataLog.andMore', { count: items.length - 10 })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Checkbox */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              disabled={loading}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t('dataLog.deleteConfirmationText')}
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={!confirmed || loading}
            loading={loading}
          >
            {isBulk
              ? t('dataLog.deleteItems', { count: itemCount })
              : t('common.delete')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
