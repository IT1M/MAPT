'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/hooks/useTranslations';

interface ReportSchedule {
  id: string;
  name: string;
  reportType: string;
  frequency: string;
  time: string;
  recipients: string[];
  enabled: boolean;
  config: any;
}

interface ReportScheduleDialogProps {
  isOpen: boolean;
  schedule: ReportSchedule | null;
  onSave: (schedule: any) => Promise<void>;
  onCancel: () => void;
}

export default function ReportScheduleDialog({
  isOpen,
  schedule,
  onSave,
  onCancel,
}: ReportScheduleDialogProps) {
  const t = useTranslations('reports.schedule');
  const [formData, setFormData] = useState({
    name: '',
    reportType: 'MONTHLY_INVENTORY',
    frequency: 'MONTHLY',
    time: '02:00',
    recipients: [] as string[],
    enabled: true,
    config: {
      type: 'MONTHLY_INVENTORY',
      dateRange: {
        from: new Date(),
        to: new Date(),
      },
      content: {
        summary: true,
        charts: true,
        detailedTable: true,
        rejectAnalysis: true,
        destinationBreakdown: true,
        categoryAnalysis: true,
        aiInsights: false,
        userActivity: false,
        auditTrail: false,
        comparative: false,
      },
      format: 'PDF',
      customization: {
        includeLogo: true,
        includeSignature: true,
        language: 'en',
        paperSize: 'a4',
        orientation: 'portrait',
      },
    },
  });

  const [newRecipient, setNewRecipient] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (schedule) {
      setFormData({
        name: schedule.name,
        reportType: schedule.reportType,
        frequency: schedule.frequency,
        time: schedule.time,
        recipients: schedule.recipients,
        enabled: schedule.enabled,
        config: schedule.config,
      });
    }
  }, [schedule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSave(formData);
    } catch (error) {
      console.error('Failed to save schedule:', error);
    } finally {
      setSaving(false);
    }
  };

  const addRecipient = () => {
    if (newRecipient && !formData.recipients.includes(newRecipient)) {
      setFormData({
        ...formData,
        recipients: [...formData.recipients, newRecipient],
      });
      setNewRecipient('');
    }
  };

  const removeRecipient = (index: number) => {
    setFormData({
      ...formData,
      recipients: formData.recipients.filter((_, i) => i !== index),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onCancel}
        ></div>

        {/* Modal panel */}
        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {schedule ? t('editSchedule') : t('createSchedule')}
              </h3>
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              {/* Schedule Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('scheduleName')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Report Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('reportType')}
                </label>
                <select
                  value={formData.reportType}
                  onChange={(e) =>
                    setFormData({ ...formData, reportType: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="MONTHLY_INVENTORY">
                    {t('../reportTypes.MONTHLY_INVENTORY')}
                  </option>
                  <option value="YEARLY_SUMMARY">
                    {t('../reportTypes.YEARLY_SUMMARY')}
                  </option>
                  <option value="CUSTOM_RANGE">
                    {t('../reportTypes.CUSTOM_RANGE')}
                  </option>
                  <option value="AUDIT_REPORT">
                    {t('../reportTypes.AUDIT_REPORT')}
                  </option>
                  <option value="USER_ACTIVITY">
                    {t('../reportTypes.USER_ACTIVITY')}
                  </option>
                  <option value="CATEGORY_ANALYSIS">
                    {t('../reportTypes.CATEGORY_ANALYSIS')}
                  </option>
                </select>
              </div>

              {/* Frequency and Time */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('frequency')}
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) =>
                      setFormData({ ...formData, frequency: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="DAILY">{t('daily')}</option>
                    <option value="WEEKLY">{t('weekly')}</option>
                    <option value="MONTHLY">{t('monthly')}</option>
                    <option value="YEARLY">{t('yearly')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('time')}
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Recipients */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('recipients')}
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="email"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    placeholder="email@example.com"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={addRecipient}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.recipients.map((recipient, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    >
                      {recipient}
                      <button
                        type="button"
                        onClick={() => removeRecipient(index)}
                        className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Enabled Toggle */}
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) =>
                      setFormData({ ...formData, enabled: e.target.checked })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('enabled')}
                  </span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={saving || formData.recipients.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? t('saving') : t('saveSchedule')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
