'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuditHighlight {
  id: string;
  action: string;
  userName: string;
  details: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

export function AuditHighlights() {
  const router = useRouter();
  const [highlights, setHighlights] = useState<AuditHighlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditHighlights();
  }, []);

  const fetchAuditHighlights = async () => {
    try {
      const response = await fetch('/api/dashboard/audit-highlights');
      if (response.ok) {
        const data = await response.json();
        setHighlights(data);
      }
    } catch (error) {
      console.error('Failed to fetch audit highlights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Audit Highlights
        </h3>
        <button
          onClick={() => router.push('/audit')}
          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          View All
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {highlights.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No audit highlights
          </p>
        ) : (
          highlights.map((highlight) => (
            <div
              key={highlight.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(highlight.severity)}`}
                    >
                      {highlight.severity}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {highlight.action}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {highlight.userName} - {highlight.details}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(highlight.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
