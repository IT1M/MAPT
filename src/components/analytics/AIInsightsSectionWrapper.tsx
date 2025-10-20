'use client';

import { useState, useEffect } from 'react';
import { AIInsightsPanel, DashboardContext } from './AIInsightsPanel';
import { AIQuestionInput, InventoryContext } from './AIQuestionInput';

export function AIInsightsSectionWrapper() {
  const [dashboardData, setDashboardData] = useState<DashboardContext | null>(
    null
  );
  const [inventoryContext, setInventoryContext] =
    useState<InventoryContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch summary data for AI insights
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const endDate = new Date();

      const response = await fetch(
        `/api/analytics/summary?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          // Transform API response to DashboardContext
          const summary = {
            totalItems: data.data.totalItems || 0,
            totalQuantity: data.data.totalQuantity || 0,
            rejectRate: data.data.rejectRate || 0,
            activeUsers: data.data.activeUsers || 0,
            categoriesCount: data.data.byCategory?.length || 0,
            avgDailyEntries: data.data.avgDailyEntries || 0,
          };

          setDashboardData({
            summary,
            trends: [],
            recentActivity: [],
          });

          // Set inventory context for Q&A
          setInventoryContext({
            totalItems: summary.totalItems,
            totalQuantity: summary.totalQuantity,
            recentActivity: [],
            topCategories:
              data.data.byCategory?.slice(0, 5).map((cat: any) => ({
                category: cat.category,
                count: cat.items,
              })) || [],
          });
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values on error
      setDashboardData({
        summary: {
          totalItems: 0,
          totalQuantity: 0,
          rejectRate: 0,
          activeUsers: 0,
          categoriesCount: 0,
          avgDailyEntries: 0,
        },
      });
      setInventoryContext({
        totalItems: 0,
        totalQuantity: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            Loading AI insights...
          </span>
        </div>
      </div>
    );
  }

  if (!dashboardData || !inventoryContext) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center text-gray-600 dark:text-gray-400">
          Unable to load AI insights. Please try refreshing the page.
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* AI Insights Panel - Takes 2 columns on large screens */}
      <div className="lg:col-span-2">
        <AIInsightsPanel
          dashboardData={dashboardData}
          onRefresh={fetchDashboardData}
        />
      </div>

      {/* AI Question Input - Takes 1 column on large screens */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            💬 Ask AI
          </h3>
          <AIQuestionInput context={inventoryContext} />
        </div>
      </div>
    </div>
  );
}
