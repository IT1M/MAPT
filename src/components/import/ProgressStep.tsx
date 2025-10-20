'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { CheckCircle2, XCircle, AlertCircle, Download } from 'lucide-react';
import type {
  ParsedData,
  ColumnMapping,
  ImportOptions,
  ValidationError,
  ImportResult,
} from '@/types/import';

interface ProgressStepProps {
  parsedData: ParsedData;
  columnMapping: ColumnMapping;
  importOptions: ImportOptions;
  validationErrors: ValidationError[];
  onComplete: (result: ImportResult) => void;
  onClose: () => void;
}

export default function ProgressStep({
  parsedData,
  columnMapping,
  importOptions,
  validationErrors,
  onComplete,
  onClose,
}: ProgressStepProps) {
  const t = useTranslations('import.progress');
  const [status, setStatus] = useState<'processing' | 'completed' | 'error'>(
    'processing'
  );
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const performImport = useCallback(async () => {
    try {
      abortControllerRef.current = new AbortController();

      // Prepare data for import
      const validRows = parsedData.rows.filter((_, index) => {
        const rowNumber = index + 2;
        return !validationErrors.some((err) => err.row === rowNumber);
      });

      // Map rows to expected format
      const mappedRows = validRows.map((row) => ({
        itemName: columnMapping.itemName
          ? row[columnMapping.itemName]
          : undefined,
        batch: columnMapping.batch ? row[columnMapping.batch] : undefined,
        quantity: columnMapping.quantity
          ? row[columnMapping.quantity]
          : undefined,
        reject: columnMapping.reject ? row[columnMapping.reject] : undefined,
        destination:
          (columnMapping.destination
            ? row[columnMapping.destination]
            : undefined) || importOptions.defaultDestination,
        category:
          (columnMapping.category ? row[columnMapping.category] : undefined) ||
          importOptions.defaultCategory,
        notes: columnMapping.notes ? row[columnMapping.notes] : undefined,
      }));

      // Create FormData
      const formData = new FormData();
      const blob = new Blob([JSON.stringify(mappedRows)], {
        type: 'application/json',
      });
      formData.append('data', blob);
      formData.append('options', JSON.stringify(importOptions));

      // Send import request
      const response = await fetch('/api/inventory/import', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('importFailed'));
      }

      const importResult: ImportResult = await response.json();

      setResult(importResult);
      setStatus('completed');
      setProgress(100);
      onComplete(importResult);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError(t('cancelled'));
      } else {
        setError(err.message || t('importFailed'));
      }
      setStatus('error');
    }
  }, [
    parsedData,
    columnMapping,
    importOptions,
    validationErrors,
    onComplete,
    t,
  ]);

  useEffect(() => {
    performImport();

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 500);

    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [performImport]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {t('title')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('description')}
        </p>
      </div>

      {status === 'processing' && (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('importing')}
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-teal-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Processing Animation */}
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mb-4"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('pleaseWait')}
            </p>
          </div>
        </div>
      )}

      {status === 'completed' && result && (
        <div className="space-y-6">
          {/* Success Icon */}
          <div className="flex flex-col items-center justify-center py-8">
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('completed')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('completedMessage')}
            </p>
          </div>

          {/* Results Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {result.successCount}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {t('successful')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {result.failedCount}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {t('failed')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Details */}
          {result.errors && result.errors.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-2">
                    {t('someErrors')}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {t('errorCount', { count: result.errors.length })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              {t('done')}
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-6">
          {/* Error Icon */}
          <div className="flex flex-col items-center justify-center py-8">
            <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
              <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('failed')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
              {error || t('failedMessage')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
