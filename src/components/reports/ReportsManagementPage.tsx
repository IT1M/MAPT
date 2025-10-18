'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import ReportGeneratorForm from './ReportGeneratorForm';
import ReportHistoryTable from './ReportHistoryTable';
import ScheduledReportsPanel from './ScheduledReportsPanel';
import ReportPreviewModal from './ReportPreviewModal';
import ReportProgressModal from './ReportProgressModal';

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

interface ReportSchedule {
  id: string;
  name: string;
  reportType: string;
  frequency: string;
  time: string;
  recipients: string[];
  enabled: boolean;
  config: any;
  lastRun?: Date;
  nextRun: Date;
  createdAt: Date;
  createdBy: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

interface ReportsManagementPageProps {
  locale: string;
  userRole: string;
}

export default function ReportsManagementPage({ locale, userRole }: ReportsManagementPageProps) {
  const t = useTranslations('reports');
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'schedules'>('generate');
  const [reports, setReports] = useState<Report[]>([]);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewReport, setPreviewReport] = useState<Report | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isAdmin = userRole === 'ADMIN';
  const canGenerate = ['ADMIN', 'MANAGER'].includes(userRole);

  useEffect(() => {
    loadData();
  }, [page, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'history') {
        const reportsRes = await fetch(`/api/reports?page=${page}&limit=10`);
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          setReports(reportsData.reports);
          setTotalPages(reportsData.pagination.totalPages);
        }
      } else if (activeTab === 'schedules') {
        const schedulesRes = await fetch('/api/reports/schedules');
        if (schedulesRes.ok) {
          const schedulesData = await schedulesRes.json();
          setSchedules(schedulesData.schedules);
        }
      }
    } catch (error) {
      console.error('Failed to load reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (config: any) => {
    try {
      setGeneratingReport(true);
      setGenerationProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      clearInterval(progressInterval);

      if (res.ok) {
        setGenerationProgress(100);
        setTimeout(() => {
          setGeneratingReport(false);
          setGenerationProgress(0);
          setActiveTab('history');
          loadData();
        }, 1000);
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      setGeneratingReport(false);
      setGenerationProgress(0);
      throw error;
    }
  };

  const handleDownload = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/download/${reportId}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${reportId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const handlePreview = (report: Report) => {
    setPreviewReport(report);
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm(t('history.confirmDelete'))) return;

    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  const handleEmail = async (reportId: string) => {
    // TODO: Implement email dialog
    console.log('Email report:', reportId);
  };

  const handleCreateSchedule = async (schedule: any) => {
    try {
      const res = await fetch('/api/reports/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to create schedule:', error);
      throw error;
    }
  };

  const handleUpdateSchedule = async (id: string, schedule: any) => {
    try {
      const res = await fetch(`/api/reports/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to update schedule:', error);
      throw error;
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm(t('schedule.confirmDelete'))) return;

    try {
      const res = await fetch(`/api/reports/schedules/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  if (loading && activeTab !== 'generate') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('generate')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'generate'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {t('generateNewReport')}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {t('reportHistory')}
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('schedules')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedules'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {t('scheduledReports')}
            </button>
          )}
        </nav>
      </div>

      {/* Content */}
      <div className="mb-8">
        {activeTab === 'generate' && canGenerate && (
          <ReportGeneratorForm onGenerate={handleGenerateReport} />
        )}

        {activeTab === 'generate' && !canGenerate && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <p className="text-yellow-800 dark:text-yellow-200">
              {t('errors.unauthorized')}
            </p>
          </div>
        )}

        {activeTab === 'history' && (
          <ReportHistoryTable
            reports={reports}
            onDownload={handleDownload}
            onPreview={handlePreview}
            onDelete={handleDelete}
            onEmail={handleEmail}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}

        {activeTab === 'schedules' && isAdmin && (
          <ScheduledReportsPanel
            schedules={schedules}
            onCreate={handleCreateSchedule}
            onUpdate={handleUpdateSchedule}
            onDelete={handleDeleteSchedule}
          />
        )}
      </div>

      {/* Modals */}
      {previewReport && (
        <ReportPreviewModal
          report={previewReport}
          isOpen={!!previewReport}
          onClose={() => setPreviewReport(null)}
          onDownload={() => handleDownload(previewReport.id)}
        />
      )}

      {generatingReport && (
        <ReportProgressModal
          isOpen={generatingReport}
          progress={generationProgress}
          onCancel={() => setGeneratingReport(false)}
        />
      )}
    </div>
  );
}
