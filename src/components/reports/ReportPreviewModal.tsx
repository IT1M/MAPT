'use client';

import { useTranslations } from '@/hooks/useTranslations';

interface Report {
  id: string;
  title: string;
  type: string;
  periodFrom: Date;
  periodTo: Date;
  generatedAt: Date;
  generatedBy: string;
  generator: {
    id: string;
    name: string;
    email: string;
  };
  fileSize: number;
  format: string;
  status: string;
  filePath: string;
  includeAIInsights: boolean;
}

interface ReportPreviewModalProps {
  report: Report;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export default function ReportPreviewModal({
  report,
  isOpen,
  onClose,
  onDownload,
}: ReportPreviewModalProps) {
  const t = useTranslations('reports.preview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {t('title')}: {report.title}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={onDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                {t('download')}
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="px-6 py-4" style={{ height: '70vh' }}>
            {report.format === 'PDF' ? (
              <iframe
                src={`/api/reports/preview/${report.id}`}
                className="w-full h-full border border-gray-300 dark:border-gray-600 rounded"
                title={report.title}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Preview not available for {report.format} format
                  </p>
                  <button
                    onClick={onDownload}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {t('download')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
