'use client';

import { useTranslations } from 'next-intl';
import { ValidationResult } from '@/types/backup';

interface BackupValidationPanelProps {
  result: ValidationResult;
  onClose: () => void;
}

export default function BackupValidationPanel({ result, onClose }: BackupValidationPanelProps) {
  const t = useTranslations('backup');

  const checks = [
    { key: 'checksum', label: t('checksumValidation'), value: result.checks.checksum },
    { key: 'completeness', label: t('completenessCheck'), value: result.checks.completeness },
    { key: 'formatValid', label: t('formatValidation'), value: result.checks.formatValid },
    { key: 'restoreTest', label: t('restoreTest'), value: result.checks.restoreTest },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('validationResults')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Overall Status */}
        <div className={`p-4 rounded-lg mb-6 ${
          result.valid
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center">
            {result.valid ? (
              <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <div className="ml-3">
              <h3 className={`text-lg font-medium ${
                result.valid
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {result.valid ? t('validationPassed') : t('validationFailed')}
              </h3>
              <p className={`text-sm mt-1 ${
                result.valid
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {result.valid ? t('backupIsValid') : t('backupHasIssues')}
              </p>
            </div>
          </div>
        </div>

        {/* Validation Checks */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            {t('validationChecks')}
          </h3>
          {checks.map((check) => (
            <div
              key={check.key}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <span className="text-sm text-gray-900 dark:text-white">
                {check.label}
              </span>
              <div className="flex items-center">
                {check.value ? (
                  <>
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-2 text-sm text-green-600 dark:text-green-400">
                      {t('passed')}
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-2 text-sm text-red-600 dark:text-red-400">
                      {t('failed')}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Errors */}
        {result.errors && result.errors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {t('errors')}
            </h3>
            <div className="space-y-2">
              {result.errors.map((error, index) => (
                <div
                  key={index}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            {t('recommendations')}
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
            {result.valid ? (
              <>
                <li>{t('backupCanBeRestored')}</li>
                <li>{t('keepBackupSecure')}</li>
                <li>{t('testRestorePeriodically')}</li>
              </>
            ) : (
              <>
                <li>{t('doNotUseBackup')}</li>
                <li>{t('createNewBackup')}</li>
                <li>{t('checkStorageIntegrity')}</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
