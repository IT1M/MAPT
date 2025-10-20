'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from '@/hooks/useLocale';

// ============================================================================
// Type Definitions
// ============================================================================

export interface AIInsight {
  type: 'finding' | 'alert' | 'recommendation' | 'prediction';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  confidence?: number;
}

export interface DashboardContext {
  summary: {
    totalItems: number;
    totalQuantity: number;
    rejectRate: number;
    activeUsers: number;
    categoriesCount: number;
    avgDailyEntries: number;
  };
  trends?: any[];
  recentActivity?: any[];
}

interface AIInsightsPanelProps {
  dashboardData: DashboardContext;
  filters?: {
    startDate?: Date | null;
    endDate?: Date | null;
    destinations?: string[];
    categories?: string[];
  };
  onRefresh?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function AIInsightsPanel({
  dashboardData,
  filters,
  onRefresh,
}: AIInsightsPanelProps) {
  const t = useTranslations('analytics.ai');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  // Fetch insights on mount and when dashboard data changes
  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardData, filters]);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Prepare request payload
      const startDate =
        filters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = filters?.endDate || new Date();

      const response = await fetch('/api/analytics/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataType: 'inventory',
          period: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI insights');
      }

      const data = await response.json();

      if (data.success) {
        // Parse insights from response
        const parsedInsights: AIInsight[] = [];

        // Add insights
        if (data.data.insights) {
          data.data.insights.forEach((insight: any) => {
            parsedInsights.push({
              type:
                insight.type === 'warning'
                  ? 'alert'
                  : insight.type === 'info'
                    ? 'finding'
                    : 'recommendation',
              priority: insight.priority,
              title:
                insight.type === 'warning'
                  ? 'Alert'
                  : insight.type === 'info'
                    ? 'Finding'
                    : 'Recommendation',
              message: insight.message,
              confidence: insight.confidence,
            });
          });
        }

        // Add trends as findings
        if (data.data.trends) {
          data.data.trends.forEach((trend: any) => {
            parsedInsights.push({
              type: 'finding',
              priority: 'medium',
              title: `${trend.product} Trend`,
              message: `${trend.product} is ${trend.trend}. ${trend.recommendation}`,
              confidence: trend.confidence,
            });
          });
        }

        // Add predictions
        if (data.data.predictions) {
          data.data.predictions.forEach((prediction: any) => {
            parsedInsights.push({
              type: 'prediction',
              priority: 'low',
              title: `${prediction.product} Forecast`,
              message: `Predicted need: ${prediction.predictedNeed} units over ${prediction.timeframe} (current: ${prediction.currentStock})`,
              confidence: prediction.confidence,
            });
          });
        }

        setInsights(parsedInsights);
        setGeneratedAt(new Date(data.data.generatedAt));
      } else {
        throw new Error(data.error?.message || 'Failed to fetch insights');
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');

      // Set fallback insights
      setInsights([
        {
          type: 'alert',
          priority: 'medium',
          title: 'AI Service Unavailable',
          message:
            'AI insights are temporarily unavailable. Please try again later.',
          confidence: 1.0,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchInsights();
    onRefresh?.();
  };

  // Group insights by type
  const groupedInsights = {
    findings: insights.filter((i) => i.type === 'finding'),
    alerts: insights.filter((i) => i.type === 'alert'),
    recommendations: insights.filter((i) => i.type === 'recommendation'),
    predictions: insights.filter((i) => i.type === 'prediction'),
  };

  // Get icon for insight type
  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'finding':
        return '🔍';
      case 'alert':
        return '⚠️';
      case 'recommendation':
        return '💡';
      case 'prediction':
        return '📈';
      default:
        return '📊';
    }
  };

  // Get color for priority
  const getPriorityColor = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const locale = useLocale();

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('insights')}
          </h2>
          {generatedAt && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(generatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
            aria-label="Refresh insights"
          >
            <svg
              className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
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
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <svg
              className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('generating')}
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <span className="text-4xl">⚠️</span>
              <p className="text-sm text-red-600 dark:text-red-400">
                {t('error')}
              </p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Insights Display */}
          {!isLoading && !error && insights.length > 0 && (
            <div className="space-y-4">
              {/* Alerts Section */}
              {groupedInsights.alerts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    ⚠️ Alerts
                  </h3>
                  <div className="space-y-2">
                    {groupedInsights.alerts.map((insight, index) => (
                      <InsightCard key={`alert-${index}`} insight={insight} />
                    ))}
                  </div>
                </div>
              )}

              {/* Findings Section */}
              {groupedInsights.findings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    🔍 Key Findings
                  </h3>
                  <div className="space-y-2">
                    {groupedInsights.findings.map((insight, index) => (
                      <InsightCard key={`finding-${index}`} insight={insight} />
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations Section */}
              {groupedInsights.recommendations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    💡 Recommendations
                  </h3>
                  <div className="space-y-2">
                    {groupedInsights.recommendations.map((insight, index) => (
                      <InsightCard
                        key={`recommendation-${index}`}
                        insight={insight}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Predictions Section */}
              {groupedInsights.predictions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    📈 Predictions
                  </h3>
                  <div className="space-y-2">
                    {groupedInsights.predictions.map((insight, index) => (
                      <InsightCard
                        key={`prediction-${index}`}
                        insight={insight}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && insights.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <span className="text-4xl">📊</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No insights available at this time
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Insight Card Component
// ============================================================================

function InsightCard({ insight }: { insight: AIInsight }) {
  const getPriorityColor = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      case 'low':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10';
    }
  };

  return (
    <div
      className={`p-3 border-l-4 rounded-r-md ${getPriorityColor(insight.priority)}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {insight.message}
          </p>
          {insight.confidence !== undefined && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Confidence: {(insight.confidence * 100).toFixed(0)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
