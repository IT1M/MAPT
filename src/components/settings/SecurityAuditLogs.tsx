'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  event: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  metadata: any;
}

interface SuspiciousActivity {
  suspicious: boolean;
  reasons: string[];
  severity: 'low' | 'medium' | 'high';
}

export default function SecurityAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [suspiciousActivity, setSuspiciousActivity] =
    useState<SuspiciousActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(
        `/api/security/audit?limit=${limit}&offset=${page * limit}&detectSuspicious=true`
      );
      const data = await response.json();

      if (data.success) {
        setLogs(data.data.logs);
        setTotal(data.data.total);
        setSuspiciousActivity(data.data.suspiciousActivity);
      }
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (event: string) => {
    const icons: Record<string, string> = {
      LOGIN_SUCCESS: '✅',
      LOGIN_FAILED: '❌',
      LOGOUT: '👋',
      PASSWORD_CHANGED: '🔑',
      PASSWORD_RESET_REQUESTED: '📧',
      PASSWORD_RESET_COMPLETED: '🔓',
      '2FA_ENABLED': '🛡️',
      '2FA_DISABLED': '⚠️',
      '2FA_VERIFIED': '✓',
      '2FA_FAILED': '✗',
      ACCOUNT_LOCKED: '🔒',
      ACCOUNT_UNLOCKED: '🔓',
      SESSION_CREATED: '🔗',
      SESSION_TERMINATED: '🔌',
      PERMISSION_CHANGED: '⚙️',
      ROLE_CHANGED: '👤',
      SENSITIVE_DATA_ACCESSED: '👁️',
      EXPORT_DATA: '📤',
      BULK_DELETE: '🗑️',
    };
    return icons[event] || '📝';
  };

  const getEventColor = (event: string) => {
    if (event.includes('FAILED') || event.includes('LOCKED')) {
      return 'text-red-600 dark:text-red-400';
    }
    if (event.includes('SUCCESS') || event.includes('ENABLED')) {
      return 'text-green-600 dark:text-green-400';
    }
    if (event.includes('CHANGED') || event.includes('RESET')) {
      return 'text-amber-600 dark:text-amber-400';
    }
    return 'text-gray-600 dark:text-gray-400';
  };

  const formatEventName = (event: string) => {
    return event
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"
          ></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Suspicious Activity Alert */}
      {suspiciousActivity?.suspicious && (
        <div
          className={`rounded-lg p-4 border ${
            suspiciousActivity.severity === 'high'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : suspiciousActivity.severity === 'medium'
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">
              {suspiciousActivity.severity === 'high' ? '🚨' : '⚠️'}
            </span>
            <div className="flex-1">
              <h4
                className={`font-semibold mb-2 ${
                  suspiciousActivity.severity === 'high'
                    ? 'text-red-900 dark:text-red-100'
                    : suspiciousActivity.severity === 'medium'
                      ? 'text-amber-900 dark:text-amber-100'
                      : 'text-blue-900 dark:text-blue-100'
                }`}
              >
                Suspicious Activity Detected
              </h4>
              <ul
                className={`text-sm space-y-1 ${
                  suspiciousActivity.severity === 'high'
                    ? 'text-red-800 dark:text-red-200'
                    : suspiciousActivity.severity === 'medium'
                      ? 'text-amber-800 dark:text-amber-200'
                      : 'text-blue-800 dark:text-blue-200'
                }`}
              >
                {suspiciousActivity.reasons.map((reason, index) => (
                  <li key={index}>• {reason}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Security Activity Log
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Recent security events on your account
          </p>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {logs.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No security events found
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{getEventIcon(log.event)}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-medium ${getEventColor(log.event)}`}
                      >
                        {formatEventName(log.event)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(
                          new Date(log.timestamp),
                          'MMM d, yyyy HH:mm:ss'
                        )}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <div className="flex items-center gap-2">
                        <span>📍 IP: {log.ipAddress}</span>
                      </div>
                      <div className="text-xs truncate">🖥️ {log.userAgent}</div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline">
                            View details
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {page * limit + 1} to{' '}
              {Math.min((page + 1) * limit, total)} of {total} events
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * limit >= total}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
