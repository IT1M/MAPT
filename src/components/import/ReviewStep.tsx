'use client';

import { useTranslations } from '@/hooks/useTranslations';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import type {
  ImportFile,
  ParsedData,
  ColumnMapping,
  ValidationError,
  ImportOptions,
} from '@/types/import';

interface ReviewStepProps {
  importFile: ImportFile;
  parsedData: ParsedData;
  columnMapping: ColumnMapping;
  validationErrors: ValidationError[];
  importOptions: ImportOptions;
  onConfirm: () => void;
  onBack: () => void;
}

export default function ReviewStep({
  importFile,
  parsedData,
  columnMapping,
  validationErrors,
  importOptions,
  onConfirm,
  onBack,
}: ReviewStepProps) {
  const t = useTranslations('import.review');

  const validRows = parsedData.rows.length - validationErrors.length;

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

      {/* File Info */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
            <FileSpreadsheet className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {t('fileInfo')}
            </h4>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">
                  {t('fileName')}
                </dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                  {importFile.name}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">
                  {t('fileSize')}
                </dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                  {(importFile.size / 1024).toFixed(2)} KB
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">
                  {t('totalRows')}
                </dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                  {parsedData.rows.length}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">
                  {t('fileType')}
                </dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                  {importFile.type.toUpperCase()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Import Summary */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {t('importSummary')}
            </h4>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">
                  {t('validRows')}
                </dt>
                <dd className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {validRows}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">
                  {t('invalidRows')}
                </dt>
                <dd className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {validationErrors.length}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Column Mapping Summary */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          {t('columnMapping')}
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(columnMapping).map(([field, column]) => {
            if (!column) return null;
            return (
              <div key={field} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t(`fields.${field}`)}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {column}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Import Options */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {t('importOptions')}
            </h4>
            <dl className="space-y-2">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600 dark:text-gray-400">
                  {t('duplicateHandling')}
                </dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  {t(`duplicateOptions.${importOptions.duplicateHandling}`)}
                </dd>
              </div>
              {importOptions.defaultDestination && (
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">
                    {t('defaultDestination')}
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {importOptions.defaultDestination}
                  </dd>
                </div>
              )}
              {importOptions.defaultCategory && (
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">
                    {t('defaultCategory')}
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {importOptions.defaultCategory}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Warning */}
      {validationErrors.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
              {t('warning')}
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              {t('warningMessage', { count: validationErrors.length })}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {t('back')}
        </button>
        <button
          onClick={onConfirm}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          {t('startImport')}
        </button>
      </div>
    </div>
  );
}
