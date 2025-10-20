'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useDataEntryForm } from '@/hooks/useDataEntryForm';
// import { useAutoSave } from '@/hooks/useAutosave'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ItemNameInput } from './ItemNameInput';
import { BatchNumberInput } from './BatchNumberInput';
import { RejectQuantityInput } from './RejectQuantityInput';
import { DestinationSelect } from './DestinationSelect';
import { CategoryInput } from './CategoryInput';
import { NotesTextarea } from './NotesTextarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { Destination } from '@prisma/client';

interface RecentEntry {
  id: string;
  itemName: string;
  batch: string;
  quantity: number;
  destination: Destination;
  createdAt: Date;
}

interface DataEntryFormProps {
  recentItems: Array<{ itemName: string; category: string | null }>;
  todayCount: number;
  recentEntries: RecentEntry[];
  userLastDestination?: Destination;
  userId: string;
  onSuccess?: (data: any) => void;
}

export function DataEntryForm({
  recentItems,
  todayCount,
  recentEntries,
  userLastDestination,
  userId,
  onSuccess,
}: DataEntryFormProps) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [hasJustSubmitted, setHasJustSubmitted] = useState(false);
  const [recentlyAddedItem, setRecentlyAddedItem] = useState<any>(null);

  // Temporary stub functions until autosave is implemented
  const clearDraft = useCallback(() => {
    // TODO: Implement draft clearing
  }, []);

  const restoreDraft = useCallback(() => {
    // TODO: Implement draft restoration
    return null;
  }, []);

  // Initialize form hook
  const { formData, meta, updateField, validate, submit, reset } =
    useDataEntryForm({
      initialData: userLastDestination
        ? { destination: userLastDestination }
        : undefined,
      onSuccess: (data) => {
        setHasJustSubmitted(true);
        setRecentlyAddedItem(data);
        clearDraft();

        // Show success toast with action buttons
        const locale =
          typeof window !== 'undefined'
            ? document.documentElement.lang || 'en'
            : 'en';

        toast.success(
          (t) => (
            <div className="flex flex-col gap-2">
              <div className="font-medium">Item added successfully!</div>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    window.location.href = `/${locale}/data-log`;
                  }}
                  className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                >
                  View in Data Log
                </button>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    const firstInput = document.querySelector<HTMLInputElement>(
                      'input[name="itemName"]'
                    );
                    firstInput?.focus();
                  }}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Add Another Item
                </button>
              </div>
            </div>
          ),
          {
            duration: 6000,
            style: {
              minWidth: '300px',
            },
          }
        );

        // Focus first field after successful submission
        setTimeout(() => {
          const firstInput = document.querySelector<HTMLInputElement>(
            'input[name="itemName"]'
          );
          firstInput?.focus();
          setHasJustSubmitted(false);
        }, 100);
        onSuccess?.(data);
      },
    });

  // Initialize autosave hook
  // TODO: Implement autosave functionality
  // const { restoreDraft, clearDraft } = useAutosave({
  //   formData,
  //   isDirty: meta.isDirty,
  //   userId,
  // })

  // Memoize event handlers with useCallback
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const result = await submit();

      // If submission failed due to validation, focus on first error field
      if (result === false && meta.errors) {
        const firstErrorField = Object.keys(meta.errors)[0];
        if (firstErrorField) {
          const errorInput = document.querySelector<
            HTMLInputElement | HTMLTextAreaElement
          >(
            `input[name="${firstErrorField}"], textarea[name="${firstErrorField}"]`
          );
          errorInput?.focus();
        }
      }
    },
    [submit, meta.errors]
  );

  const handleClear = useCallback(() => {
    const confirmed = window.confirm(
      'Clear form? Unsaved changes will be lost.'
    );
    if (confirmed) {
      reset(formData.destination);
      clearDraft();
      setTimeout(() => {
        const firstInput = document.querySelector<HTMLInputElement>(
          'input[name="itemName"]'
        );
        firstInput?.focus();
      }, 100);
    }
  }, [reset, formData.destination, clearDraft]);

  const handleRestoreDraft = useCallback(
    (restore: boolean) => {
      if (restore) {
        const draft = restoreDraft();
        if (draft) {
          Object.entries(draft).forEach(([key, value]) => {
            updateField(key as any, value as string);
          });
        }
      } else {
        clearDraft();
      }
      setShowDraftDialog(false);
      setTimeout(() => {
        const firstInput = document.querySelector<HTMLInputElement>(
          'input[name="itemName"]'
        );
        firstInput?.focus();
      }, 100);
    },
    [restoreDraft, clearDraft, updateField]
  );

  // Memoize keyboard shortcuts
  const keyboardShortcuts = useMemo(
    () => [
      {
        key: 's',
        ctrlKey: true,
        description: 'Save entry',
        callback: () => {
          if (!meta.isSubmitting) {
            handleSubmit();
          }
        },
      },
      {
        key: 'Enter',
        ctrlKey: true,
        description: 'Save entry',
        callback: () => {
          if (!meta.isSubmitting) {
            handleSubmit();
          }
        },
      },
      {
        key: 'Escape',
        description: 'Clear form',
        callback: handleClear,
      },
    ],
    [meta.isSubmitting, handleSubmit, handleClear]
  );

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({ shortcuts: keyboardShortcuts, enabled: true });

  // Update current date/time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Check for draft on mount
  useEffect(() => {
    const draft = restoreDraft();
    if (draft) {
      setShowDraftDialog(true);
    } else {
      // Focus first field on mount if no draft
      setTimeout(() => {
        const firstInput = document.querySelector<HTMLInputElement>(
          'input[name="itemName"]'
        );
        firstInput?.focus();
      }, 100);
    }
  }, [restoreDraft]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (meta.isDirty && !hasJustSubmitted) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [meta.isDirty, hasJustSubmitted]);

  // Memoize formatted date time
  const formattedDateTime = useMemo(() => {
    return currentDateTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [currentDateTime]);

  // Memoize form validity check
  const isFormValid = useMemo(() => {
    return (
      formData.itemName.length >= 2 &&
      formData.batch.length >= 3 &&
      formData.quantity &&
      parseInt(formData.quantity) > 0 &&
      formData.destination
    );
  }, [
    formData.itemName,
    formData.batch,
    formData.quantity,
    formData.destination,
  ]);

  return (
    <>
      {/* Draft Restoration Dialog */}
      {showDraftDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Restore Draft?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              You have unsaved changes from a previous session. Would you like
              to restore them?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => handleRestoreDraft(false)}
              >
                Discard
              </Button>
              <Button
                variant="primary"
                onClick={() => handleRestoreDraft(true)}
              >
                Restore Draft
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Recently Added Item Card */}
      {recentlyAddedItem && (
        <div className="w-full max-w-7xl mx-auto mb-4 animate-fade-in">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-600 dark:text-green-400 text-xl">
                    ✓
                  </span>
                  <h3 className="text-sm font-semibold text-green-900 dark:text-green-100">
                    Recently Added Item
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-green-700 dark:text-green-300 font-medium">
                      Item:
                    </span>
                    <p className="text-green-900 dark:text-green-100">
                      {recentlyAddedItem.itemName}
                    </p>
                  </div>
                  <div>
                    <span className="text-green-700 dark:text-green-300 font-medium">
                      Batch:
                    </span>
                    <p className="text-green-900 dark:text-green-100 font-mono text-xs">
                      {recentlyAddedItem.batch}
                    </p>
                  </div>
                  <div>
                    <span className="text-green-700 dark:text-green-300 font-medium">
                      Quantity:
                    </span>
                    <p className="text-green-900 dark:text-green-100">
                      {recentlyAddedItem.quantity}
                    </p>
                  </div>
                  <div>
                    <span className="text-green-700 dark:text-green-300 font-medium">
                      Destination:
                    </span>
                    <p className="text-green-900 dark:text-green-100">
                      {recentlyAddedItem.destination}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setRecentlyAddedItem(null)}
                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                aria-label="Dismiss"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <main
        className="w-full max-w-7xl mx-auto"
        role="main"
        aria-label="Data entry interface"
      >
        {/* Skip to main content link for screen readers */}
        <a
          href="#data-entry-form"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Skip to form
        </a>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          {/* Form Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <span>📦</span>
                  <span>Inventory Data Entry</span>
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Enter new inventory items - Saudi Mais Co.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {formattedDateTime}
                </p>
                {meta.isDirty && (
                  <p
                    className="text-xs text-gray-500 dark:text-gray-500 mt-1"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    💾 Draft will be saved automatically...
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Form Body */}
          <form
            id="data-entry-form"
            onSubmit={handleSubmit}
            className="p-4 md:p-6 pb-24 md:pb-6"
            role="form"
            aria-label="Inventory data entry form"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Item Name */}
              <div>
                <ItemNameInput
                  label="Item Name"
                  placeholder="e.g., Surgical Gloves"
                  value={formData.itemName}
                  onChange={(value) => updateField('itemName', value)}
                  error={meta.errors.itemName}
                  name="itemName"
                  required
                  aria-required="true"
                />
              </div>

              {/* Batch Number */}
              <div>
                <BatchNumberInput
                  label="Batch Number"
                  placeholder="e.g., BATCH-2024-001"
                  value={formData.batch}
                  onChange={(value) => updateField('batch', value)}
                  error={meta.errors.batch}
                  warning={meta.batchWarning || undefined}
                  required
                  aria-required="true"
                />
              </div>

              {/* Quantity */}
              <div>
                <Input
                  type="number"
                  label="Quantity"
                  placeholder="Enter quantity"
                  value={formData.quantity}
                  onChange={(e) => updateField('quantity', e.target.value)}
                  error={meta.errors.quantity}
                  min="1"
                  max="1000000"
                  inputMode="numeric"
                  required
                  aria-required="true"
                />
              </div>

              {/* Reject Quantity */}
              <div>
                <RejectQuantityInput
                  label="Reject Quantity"
                  placeholder="Enter reject quantity"
                  value={formData.reject}
                  quantity={formData.quantity}
                  onChange={(value) => updateField('reject', value)}
                  error={meta.errors.reject}
                />
              </div>

              {/* Destination - Full Width */}
              <div className="md:col-span-2">
                <DestinationSelect
                  label="Destination"
                  value={formData.destination}
                  onChange={(value) => updateField('destination', value)}
                  error={meta.errors.destination}
                  lastUsed={userLastDestination}
                  required
                />
              </div>

              {/* Category */}
              <div>
                <CategoryInput
                  label="Category (Optional)"
                  placeholder="e.g., Surgical Supplies"
                  value={formData.category}
                  onChange={(value) => updateField('category', value)}
                  error={meta.errors.category}
                  name="category"
                />
              </div>

              {/* Notes - Full Width */}
              <div className="md:col-span-2">
                <NotesTextarea
                  label="Notes (Optional)"
                  placeholder="Add any additional notes..."
                  value={formData.notes}
                  onChange={(value) => updateField('notes', value)}
                  error={meta.errors.notes}
                  maxLength={500}
                  name="notes"
                />
              </div>
            </div>

            {/* Error Message with Retry */}
            {meta.lastError && meta.canRetry && (
              <div
                className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start gap-3">
                  <span className="text-red-600 dark:text-red-400 text-xl">
                    ⚠️
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                      {meta.lastError}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={handleSubmit}
                    disabled={meta.isSubmitting}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {/* Form Actions - Desktop */}
            <div className="hidden md:flex mt-8 gap-3 items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="large"
                  loading={meta.isSubmitting}
                  disabled={!isFormValid || meta.isSubmitting}
                >
                  {meta.isSubmitting ? 'Saving...' : 'Save Entry'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="large"
                  onClick={handleClear}
                  disabled={meta.isSubmitting}
                >
                  Clear Form
                </Button>
              </div>
              <Link
                href="/inventory"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium transition-colors"
              >
                View All Entries →
              </Link>
            </div>
          </form>

          {/* Form Actions - Mobile Sticky */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-40">
            <div className="flex flex-col gap-2 max-w-7xl mx-auto">
              <Button
                type="button"
                variant="primary"
                size="large"
                loading={meta.isSubmitting}
                disabled={!isFormValid || meta.isSubmitting}
                onClick={handleSubmit}
                className="w-full"
              >
                {meta.isSubmitting ? 'Saving...' : 'Save Entry'}
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="large"
                  onClick={handleClear}
                  disabled={meta.isSubmitting}
                  className="flex-1"
                >
                  Clear Form
                </Button>
                <Link
                  href="/inventory"
                  className="flex-1 flex items-center justify-center px-4 py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium transition-colors border border-primary-600 dark:border-primary-400 rounded-lg"
                >
                  View All
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        <aside
          className="mt-4 mb-4 md:mb-0 text-center text-xs text-gray-500 dark:text-gray-400"
          role="complementary"
          aria-label="Keyboard shortcuts information"
        >
          <p>
            Keyboard shortcuts:{' '}
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              Ctrl+S
            </kbd>{' '}
            or{' '}
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              Ctrl+Enter
            </kbd>{' '}
            to save,{' '}
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              Esc
            </kbd>{' '}
            to clear
          </p>
        </aside>
      </main>
    </>
  );
}
