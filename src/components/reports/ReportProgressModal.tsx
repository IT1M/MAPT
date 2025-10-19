'use client';

import { useTranslations } from '@/hooks/useTranslations';

interface ReportProgressModalProps {
  isOpen: boolean;
  progress: number;
  onCancel: () => void;
}

export default function ReportProgressModal({
  isOpen,
  progress,
  onCancel,
}: ReportProgressModalProps) {
  const t = useTranslations('reports.progress');

  if (!isOpen) return null;

  const getProgressStep = () => {
    if (progress < 10) return t('fetchingData');
    if (progress < 25) return t('calculatingStats');
    if (progress < 40) return t('generatingCharts');
    if (progress < 60) return t('requestingInsights');
    if (progress < 80) return t('creatingDocument');
    if (progress < 95) return t('finalizing');
    return t('ready');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"></div>

        {/* Modal panel */}
        <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {t('title')}
            </h3>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getProgressStep()}
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Status Icon */}
            <div className="flex justify-center my-6">
              {progress < 100 ? (
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
              ) : (
                <div className="rounded-full h-16 w-16 bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>

            {/* Message */}
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              {progress < 100
                ? 'Please wait while we generate your report...'
                : t('complete')}
            </p>
          </div>

          {/* Footer */}
          {progress < 100 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('cancel')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
