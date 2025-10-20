'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { AlertTriangle, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { batchImportRowSchema } from '@/utils/validators';
import type {
  ColumnMapping,
  ParsedData,
  ValidationError,
} from '@/types/import';

interface ValidationStepProps {
  parsedData: ParsedData;
  columnMapping: ColumnMapping;
  onComplete: (errors: ValidationError[]) => void;
  onBack: () => void;
}

export default function ValidationStep({
  parsedData,
  columnMapping,
  onComplete,
  onBack,
}: ValidationStepProps) {
  const t = useTranslations('import.validation');
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [validCount, setValidCount] = useState(0);
  const [showAllErrors, setShowAllErrors] = useState(false);

  const validateData = useCallback(() => {
    setIsValidating(true);
    const errors: ValidationError[] = [];
    let valid = 0;

    for (let i = 0; i < parsedData.rows.length; i++) {
      const row = parsedData.rows[i];
      const rowNumber = i + 2; // +2 because row 1 is header

      // Map columns to expected fields
      const processedRow = {
        itemName: columnMapping.itemName
          ? row[columnMapping.itemName]
          : undefined,
        batch: columnMapping.batch ? row[columnMapping.batch] : undefined,
        quantity: columnMapping.quantity
          ? parseInt(String(row[columnMapping.quantity]))
          : undefined,
        reject: columnMapping.reject
          ? parseInt(String(row[columnMapping.reject] || '0'))
          : 0,
        destination: columnMapping.destination
          ? row[columnMapping.destination]
          : undefined,
        category: columnMapping.category
          ? row[columnMapping.category]
          : undefined,
        notes: columnMapping.notes ? row[columnMapping.notes] : undefined,
      };

      // Validate with Zod schema
      const validationResult = batchImportRowSchema.safeParse(processedRow);

      if (!validationResult.success) {
        validationResult.error.errors.forEach((err) => {
          const field = err.path[0] as string;
          const value = processedRow[field as keyof typeof processedRow];

          // Generate suggestions
          let suggestion: string | undefined;

          if (field === 'quantity' && isNaN(Number(value))) {
            suggestion = t('suggestions.removeNonNumeric');
          } else if (field === 'destination' && value) {
            const upperValue = String(value).toUpperCase();
            if (upperValue.includes('MAIS') || upperValue.includes('ميس')) {
              suggestion = t('suggestions.useMais');
            } else if (
              upperValue.includes('FOZAN') ||
              upperValue.includes('فوزان')
            ) {
              suggestion = t('suggestions.useFozan');
            }
          } else if (
            field === 'batch' &&
            value &&
            !/^[A-Za-z0-9-]+$/.test(String(value))
          ) {
            suggestion = t('suggestions.removeSpecialChars');
          }

          errors.push({
            row: rowNumber,
            field,
            value,
            error: err.message,
            suggestion,
          });
        });
      } else {
        valid++;
      }
    }

    setValidationErrors(errors);
    setValidCount(valid);
    setIsValidating(false);
  }, [parsedData.rows, columnMapping, t]);

  useEffect(() => {
    validateData();
  }, [validateData]);

  const handleContinue = useCallback(() => {
    onComplete(validationErrors);
  }, [validationErrors, onComplete]);

  const displayedErrors = showAllErrors
    ? validationErrors
    : validationErrors.slice(0, 10);
  const hasMoreErrors = validationErrors.length > 10;

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

      {isValidating ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('validating')}
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {parsedData.rows.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('totalRows')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {validCount}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('validRows')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {validationErrors.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('errors')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Errors Table */}
          {validationErrors.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('errorDetails')}
                </h4>
                {hasMoreErrors && (
                  <button
                    onClick={() => setShowAllErrors(!showAllErrors)}
                    className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
                  >
                    {showAllErrors ? t('showLess') : t('showAll')}
                  </button>
                )}
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          {t('row')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          {t('field')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          {t('value')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          {t('error')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          {t('suggestion')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {displayedErrors.map((error, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {error.row}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {t(`fields.${error.field}`)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {error.value !== undefined && error.value !== null
                              ? String(error.value).substring(0, 30)
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                            {error.error}
                          </td>
                          <td className="px-4 py-3">
                            {error.suggestion && (
                              <div className="flex items-start gap-2">
                                <Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {error.suggestion}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {hasMoreErrors && !showAllErrors && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  {t('moreErrors', { count: validationErrors.length - 10 })}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-200">
                  {t('allValid')}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {t('readyToImport')}
                </p>
              </div>
            </div>
          )}

          {/* Warning for errors */}
          {validationErrors.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                  {t('errorsFound')}
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {t('errorsWillBeSkipped')}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          disabled={isValidating}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('back')}
        </button>
        <button
          onClick={handleContinue}
          disabled={isValidating}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
        >
          {t('continue')}
        </button>
      </div>
    </div>
  );
}
