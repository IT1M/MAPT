'use client';

import React, { useState, lazy, Suspense } from 'react';
import { DataEntryForm } from './DataEntryForm';
import type { QuickStatsEntry } from '@/components/dashboard/QuickStatsWidget';
import type { Destination } from '@prisma/client';

// Lazy load QuickStatsWidget for better performance
const QuickStatsWidget = lazy(() =>
  import('@/components/dashboard/QuickStatsWidget').then((mod) => ({
    default: mod.QuickStatsWidget,
  }))
);

interface DataEntryFormWithStatsProps {
  recentItems: Array<{ itemName: string; category: string | null }>;
  todayCount: number;
  recentEntries: QuickStatsEntry[];
  userLastDestination?: Destination;
  userId: string;
}

export function DataEntryFormWithStats({
  recentItems,
  todayCount: initialTodayCount,
  recentEntries: initialRecentEntries,
  userLastDestination,
  userId,
}: DataEntryFormWithStatsProps) {
  const [todayCount, setTodayCount] = useState(initialTodayCount);
  const [recentEntries, setRecentEntries] = useState(initialRecentEntries);

  const handleSuccess = (newEntry: any) => {
    // Update today's count
    setTodayCount((prev) => prev + 1);

    // Add new entry to the top of recent entries and keep only 5
    const updatedEntries = [
      {
        id: newEntry.id,
        itemName: newEntry.itemName,
        batch: newEntry.batch,
        quantity: newEntry.quantity,
        destination: newEntry.destination,
        createdAt: new Date(newEntry.createdAt),
      },
      ...recentEntries,
    ].slice(0, 5);

    setRecentEntries(updatedEntries);
  };

  const handleRefresh = async () => {
    try {
      // Fetch updated stats from the server
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const response = await fetch(
        `/api/inventory?userId=${userId}&todayStart=${todayStart.toISOString()}&limit=5`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTodayCount(data.todayCount || todayCount);
          setRecentEntries(
            data.recentEntries?.map((entry: any) => ({
              ...entry,
              createdAt: new Date(entry.createdAt),
            })) || recentEntries
          );
        }
      }
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  };

  return (
    <div className="flex gap-6 w-full max-w-[1600px] mx-auto">
      <div className="flex-1 min-w-0">
        <DataEntryForm
          recentItems={recentItems}
          todayCount={todayCount}
          recentEntries={recentEntries}
          userLastDestination={userLastDestination}
          userId={userId}
          onSuccess={handleSuccess}
        />
      </div>
      <Suspense
        fallback={
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        }
      >
        <QuickStatsWidget
          todayCount={todayCount}
          recentEntries={recentEntries}
          onRefresh={handleRefresh}
        />
      </Suspense>
    </div>
  );
}
