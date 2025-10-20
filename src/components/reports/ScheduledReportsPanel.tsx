'use client';

import { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import ReportScheduleDialog from './ReportScheduleDialog';

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

interface ScheduledReportsPanelProps {
  schedules: ReportSchedule[];
  onCreate: (schedule: any) => Promise<void>;
  onUpdate: (id: string, schedule: any) => Promise<void>;
  onDelete: (id: string) => void;
}

export default function ScheduledReportsPanel({
  schedules,
  onCreate,
  onUpdate,
  onDelete,
}: ScheduledReportsPanelProps) {
  const t = useTranslations('reports.schedule');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ReportSchedule | null>(
    null
  );

  const handleCreate = () => {
    setEditingSchedule(null);
    setDialogOpen(true);
  };

  const handleEdit = (schedule: ReportSchedule) => {
    setEditingSchedule(schedule);
    setDialogOpen(true);
  };

  const handleSave = async (schedule: any) => {
    try {
      if (editingSchedule) {
        await onUpdate(editingSchedule.id, schedule);
      } else {
        await onCreate(schedule);
      }
      setDialogOpen(false);
      setEditingSchedule(null);
    } catch (error) {
      console.error('Failed to save schedule:', error);
      throw error;
    }
  };

  const handleToggle = async (schedule: ReportSchedule) => {
    try {
      await onUpdate(schedule.id, { ...schedule, enabled: !schedule.enabled });
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return t('never');
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('title')}
        </h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          {t('createSchedule')}
        </button>
      </div>

      {/* Schedules List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {schedules.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            {t('noSchedules')}
          </div>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {schedule.name}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        schedule.enabled
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {schedule.enabled ? t('enabled') : 'Disabled'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">{t('reportType')}:</span>{' '}
                      {t(`../reportTypes.${schedule.reportType}` as any)}
                    </div>
                    <div>
                      <span className="font-medium">{t('frequency')}:</span>{' '}
                      {t(schedule.frequency.toLowerCase() as any)}
                    </div>
                    <div>
                      <span className="font-medium">{t('time')}:</span>{' '}
                      {schedule.time}
                    </div>
                    <div>
                      <span className="font-medium">{t('recipients')}:</span>{' '}
                      {schedule.recipients.length} recipient(s)
                    </div>
                    <div>
                      <span className="font-medium">{t('lastRun')}:</span>{' '}
                      {formatDate(schedule.lastRun)}
                    </div>
                    <div>
                      <span className="font-medium">{t('nextRun')}:</span>{' '}
                      {formatDate(schedule.nextRun)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(schedule)}
                    className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    title={t('edit')}
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleToggle(schedule)}
                    className="p-2 text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                    title={schedule.enabled ? t('disable') : t('enable')}
                  >
                    {schedule.enabled ? (
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
                          d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ) : (
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
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => onDelete(schedule.id)}
                    className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    title={t('delete')}
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dialog */}
      {dialogOpen && (
        <ReportScheduleDialog
          isOpen={dialogOpen}
          schedule={editingSchedule}
          onSave={handleSave}
          onCancel={() => {
            setDialogOpen(false);
            setEditingSchedule(null);
          }}
        />
      )}
    </div>
  );
}
