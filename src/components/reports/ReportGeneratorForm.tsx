'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface ReportConfig {
  type: string;
  dateRange: {
    from: Date;
    to: Date;
  };
  content: {
    summary: boolean;
    charts: boolean;
    detailedTable: boolean;
    rejectAnalysis: boolean;
    destinationBreakdown: boolean;
    categoryAnalysis: boolean;
    aiInsights: boolean;
    userActivity: boolean;
    auditTrail: boolean;
    comparative: boolean;
  };
  format: string;
  customization: {
    includeLogo: boolean;
    includeSignature: boolean;
    language: string;
    paperSize: string;
    orientation: string;
  };
  email?: {
    enabled: boolean;
    recipients: string[];
    subject: string;
    message: string;
  };
}

interface ReportGeneratorFormProps {
  onGenerate: (config: ReportConfig) => Promise<void>;
}

export default function ReportGeneratorForm({ onGenerate }: ReportGeneratorFormProps) {
  const t = useTranslations('reports.generator');
  const [config, setConfig] = useState<ReportConfig>({
    type: 'MONTHLY_INVENTORY',
    dateRange: {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
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
    email: {
      enabled: false,
      recipients: [],
      subject: '',
      message: '',
    },
  });

  const [generating, setGenerating] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      await onGenerate(config);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const addRecipient = () => {
    if (newRecipient && config.email) {
      setConfig({
        ...config,
        email: {
          ...config.email,
          recipients: [...config.email.recipients, newRecipient],
        },
      });
      setNewRecipient('');
    }
  };

  const removeRecipient = (index: number) => {
    if (config.email) {
      setConfig({
        ...config,
        email: {
          ...config.email,
          recipients: config.email.recipients.filter((_, i) => i !== index),
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {/* Report Type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('reportType')}
        </label>
        <select
          value={config.type}
          onChange={(e) => setConfig({ ...config, type: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="MONTHLY_INVENTORY">{t('../reportTypes.MONTHLY_INVENTORY')}</option>
          <option value="YEARLY_SUMMARY">{t('../reportTypes.YEARLY_SUMMARY')}</option>
          <option value="CUSTOM_RANGE">{t('../reportTypes.CUSTOM_RANGE')}</option>
          <option value="AUDIT_REPORT">{t('../reportTypes.AUDIT_REPORT')}</option>
          <option value="USER_ACTIVITY">{t('../reportTypes.USER_ACTIVITY')}</option>
          <option value="CATEGORY_ANALYSIS">{t('../reportTypes.CATEGORY_ANALYSIS')}</option>
        </select>
      </div>

      {/* Date Range */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('startDate')}
          </label>
          <input
            type="date"
            value={config.dateRange.from.toISOString().split('T')[0]}
            onChange={(e) =>
              setConfig({
                ...config,
                dateRange: { ...config.dateRange, from: new Date(e.target.value) },
              })
            }
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('endDate')}
          </label>
          <input
            type="date"
            value={config.dateRange.to.toISOString().split('T')[0]}
            onChange={(e) =>
              setConfig({
                ...config,
                dateRange: { ...config.dateRange, to: new Date(e.target.value) },
              })
            }
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Content Options */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t('content')}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(config.content).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    content: { ...config.content, [key]: e.target.checked },
                  })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t(key as any)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Format */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('format')}
        </label>
        <div className="flex space-x-4">
          {['PDF', 'EXCEL', 'PPTX'].map((format) => (
            <label key={format} className="flex items-center space-x-2">
              <input
                type="radio"
                name="format"
                value={format}
                checked={config.format === format}
                onChange={(e) => setConfig({ ...config, format: e.target.value })}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t(`../formats.${format}` as any)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Customization */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t('customization')}
        </label>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.customization.includeLogo}
              onChange={(e) =>
                setConfig({
                  ...config,
                  customization: { ...config.customization, includeLogo: e.target.checked },
                })
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t('includeLogo')}
            </span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.customization.includeSignature}
              onChange={(e) =>
                setConfig({
                  ...config,
                  customization: { ...config.customization, includeSignature: e.target.checked },
                })
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t('includeSignature')}
            </span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                {t('language')}
              </label>
              <select
                value={config.customization.language}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    customization: { ...config.customization, language: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="en">{t('english')}</option>
                <option value="ar">{t('arabic')}</option>
                <option value="bilingual">{t('bilingual')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                {t('paperSize')}
              </label>
              <select
                value={config.customization.paperSize}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    customization: { ...config.customization, paperSize: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                {t('orientation')}
              </label>
              <select
                value={config.customization.orientation}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    customization: { ...config.customization, orientation: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="portrait">{t('portrait')}</option>
                <option value="landscape">{t('landscape')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Email Settings */}
      <div className="mb-6">
        <label className="flex items-center space-x-2 mb-3">
          <input
            type="checkbox"
            checked={config.email?.enabled}
            onChange={(e) =>
              setConfig({
                ...config,
                email: { ...config.email!, enabled: e.target.checked },
              })
            }
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('emailWhenReady')}
          </span>
        </label>

        {config.email?.enabled && (
          <div className="space-y-4 pl-6">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
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
                  {t('addRecipient')}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.email.recipients.map((recipient, index) => (
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
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                {t('subject')}
              </label>
              <input
                type="text"
                value={config.email.subject}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    email: { ...config.email!, subject: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                {t('message')}
              </label>
              <textarea
                value={config.email.message}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    email: { ...config.email!, message: e.target.value },
                  })
                }
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={generating}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? t('generating') : t('generate')}
        </button>
      </div>
    </form>
  );
}
