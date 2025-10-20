'use client';

import { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { Button } from '@/components/ui/button';

// ============================================================================
// Type Definitions
// ============================================================================

export interface DashboardSnapshot {
  summary: {
    totalItems: number;
    totalQuantity: number;
    rejectRate: number;
    activeUsers: number;
    categoriesCount: number;
    avgDailyEntries: number;
    maisPercentage: number;
    fozanPercentage: number;
    topContributor?: { name: string; count: number };
    mostActiveCategory?: string;
  };
  charts?: ChartSnapshot[];
  insights?: any[];
  timestamp: Date;
}

export interface ChartSnapshot {
  title: string;
  imageData?: string; // base64 PNG
  data: any[]; // CSV data
}

interface DashboardExporterProps {
  dashboardData: DashboardSnapshot;
  filters?: {
    startDate?: Date | null;
    endDate?: Date | null;
    destinations?: string[];
    categories?: string[];
  };
  onExportComplete?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function DashboardExporter({
  dashboardData,
  filters,
  onExportComplete,
}: DashboardExporterProps) {
  const t = useTranslations('analytics.export');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (format: 'pdf' | 'email') => {
    setIsExporting(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress updates
      setProgress(10);

      // Prepare export request
      const exportData = {
        summary: dashboardData.summary,
        filters: {
          startDate: filters?.startDate?.toISOString() || null,
          endDate: filters?.endDate?.toISOString() || null,
          destinations: filters?.destinations || [],
          categories: filters?.categories || [],
        },
        charts: dashboardData.charts || [],
        insights: dashboardData.insights || [],
        timestamp: dashboardData.timestamp.toISOString(),
      };

      setProgress(30);

      // Call export API
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...exportData,
          format,
        }),
      });

      setProgress(60);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Export failed');
      }

      setProgress(80);

      const result = await response.json();

      if (result.success) {
        setProgress(100);

        if (format === 'pdf' && result.data.fileUrl) {
          // Download PDF
          const link = document.createElement('a');
          link.href = result.data.fileUrl;
          link.download = result.data.fileName || 'analytics-dashboard.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else if (format === 'email') {
          // Show success message for email
          alert('Dashboard report has been sent to your email');
        }

        onExportComplete?.();
      } else {
        throw new Error(result.error?.message || 'Export failed');
      }
    } catch (err) {
      console.error('Export error:', err);
      setError(
        err instanceof Error ? err.message : 'An error occurred during export'
      );
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="primary"
        size="small"
        onClick={() => handleExport('pdf')}
        disabled={isExporting}
        aria-label={t('dashboard')}
      >
        {isExporting ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="ml-2">{progress}%</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="ml-2">{t('dashboard')}</span>
          </>
        )}
      </Button>

      {/* Progress Indicator */}
      {isExporting && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                Exporting dashboard...
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4 z-50">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
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
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Export Failed
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
              <button
                onClick={() => setError(null)}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 mt-2 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
