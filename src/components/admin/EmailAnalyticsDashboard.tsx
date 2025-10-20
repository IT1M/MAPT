'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/hooks/useTranslations';

interface EmailAnalytics {
  summary: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    successRate: number;
    avgDeliveryTime: number;
  };
  templateStats: Array<{
    template: string;
    count: number;
  }>;
  deliveryRate: Array<{
    date: Date;
    sent: number;
    failed: number;
    total: number;
    successRate: string;
  }>;
  recentFailures: Array<{
    id: string;
    to: string;
    subject: string;
    template: string;
    errorMessage: string | null;
    failedAt: Date | null;
    attempts: number;
  }>;
  period: {
    days: number;
    startDate: Date;
    endDate: Date;
  };
}

export default function EmailAnalyticsDashboard() {
  const t = useTranslations();
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [retrying, setRetrying] = useState<string[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/email-analytics?days=${days}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch email analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const retryEmail = async (emailId: string) => {
    try {
      setRetrying([...retrying, emailId]);

      const response = await fetch('/api/admin/email-analytics/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailIds: [emailId] }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh analytics
        fetchAnalytics();
      }
    } catch (error) {
      console.error('Failed to retry email:', error);
    } finally {
      setRetrying(retrying.filter((id) => id !== emailId));
    }
  };

  const retryAllFailed = async () => {
    if (!analytics?.recentFailures.length) return;

    const emailIds = analytics.recentFailures.map((f) => f.id);

    try {
      setRetrying(emailIds);

      const response = await fetch('/api/admin/email-analytics/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailIds }),
      });

      const data = await response.json();

      if (data.success) {
        fetchAnalytics();
      }
    } catch (error) {
      console.error('Failed to retry emails:', error);
    } finally {
      setRetrying([]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8 text-gray-500">
        Failed to load email analytics
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Email Analytics
        </h2>

        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Emails
          </div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {analytics.summary.total.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Sent Successfully
          </div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {analytics.summary.sent.toLocaleString()}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            {analytics.summary.successRate.toFixed(1)}% success rate
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Failed
          </div>
          <div className="mt-2 text-3xl font-bold text-red-600">
            {analytics.summary.failed.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Avg Delivery Time
          </div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {analytics.summary.avgDeliveryTime}s
          </div>
        </div>
      </div>

      {/* Template Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Emails by Template
        </h3>
        <div className="space-y-3">
          {analytics.templateStats.map((stat) => (
            <div
              key={stat.template}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {stat.template.replace(/-/g, ' ')}
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {stat.count.toLocaleString()} emails
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Failures */}
      {analytics.recentFailures.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Failures
            </h3>
            <button
              onClick={retryAllFailed}
              disabled={retrying.length > 0}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {retrying.length > 0 ? 'Retrying...' : 'Retry All'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Error
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Attempts
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {analytics.recentFailures.map((failure) => (
                  <tr key={failure.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {failure.to}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {failure.subject}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {failure.template.replace(/-/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400 max-w-xs truncate">
                      {failure.errorMessage || 'Unknown error'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {failure.attempts}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => retryEmail(failure.id)}
                        disabled={retrying.includes(failure.id)}
                        className="text-teal-600 hover:text-teal-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {retrying.includes(failure.id)
                          ? 'Retrying...'
                          : 'Retry'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delivery Rate Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Daily Delivery Rate
        </h3>
        <div className="space-y-2">
          {analytics.deliveryRate.slice(0, 10).map((day) => (
            <div
              key={day.date.toString()}
              className="flex items-center space-x-4"
            >
              <div className="text-sm text-gray-500 dark:text-gray-400 w-24">
                {new Date(day.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-green-500 h-full flex items-center justify-end px-2"
                      style={{ width: `${day.successRate}%` }}
                    >
                      {parseFloat(day.successRate) > 20 && (
                        <span className="text-xs font-medium text-white">
                          {day.successRate}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 w-20 text-right">
                    {day.sent}/{day.total}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
