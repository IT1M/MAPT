'use client';

import { useEffect, useState } from 'react';

interface HeatmapData {
  hour: number;
  day: number;
  count: number;
}

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hours = Array.from({ length: 24 }, (_, i) => i);

export function ActivityHeatmap() {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  const fetchHeatmapData = async () => {
    try {
      const response = await fetch('/api/dashboard/activity-heatmap');
      if (response.ok) {
        const heatmapData = await response.json();
        setData(heatmapData);
      }
    } catch (error) {
      console.error('Failed to fetch heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntensity = (count: number, maxCount: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    const percentage = (count / maxCount) * 100;
    if (percentage < 25) return 'bg-primary-200 dark:bg-primary-900/40';
    if (percentage < 50) return 'bg-primary-400 dark:bg-primary-700/60';
    if (percentage < 75) return 'bg-primary-600 dark:bg-primary-600/80';
    return 'bg-primary-800 dark:bg-primary-500';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Activity Heatmap (Last 7 Days)
      </h3>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex gap-1 mb-2">
            <div className="w-12"></div>
            {hours
              .filter((_, i) => i % 3 === 0)
              .map((hour) => (
                <div
                  key={hour}
                  className="w-8 text-xs text-gray-500 dark:text-gray-400 text-center"
                >
                  {hour}h
                </div>
              ))}
          </div>

          {days.map((day, dayIndex) => (
            <div key={day} className="flex gap-1 mb-1">
              <div className="w-12 text-xs text-gray-600 dark:text-gray-400 flex items-center">
                {day}
              </div>
              {hours.map((hour) => {
                const cellData = data.find(
                  (d) => d.day === dayIndex && d.hour === hour
                );
                const count = cellData?.count || 0;
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`w-8 h-6 rounded ${getIntensity(count, maxCount)} hover:ring-2 hover:ring-primary-500 transition-all cursor-pointer group relative`}
                    title={`${day} ${hour}:00 - ${count} events`}
                  >
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {day} {hour}:00
                      <br />
                      {count} events
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          <div className="flex items-center gap-2 mt-4 text-xs text-gray-600 dark:text-gray-400">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800"></div>
              <div className="w-4 h-4 rounded bg-primary-200 dark:bg-primary-900/40"></div>
              <div className="w-4 h-4 rounded bg-primary-400 dark:bg-primary-700/60"></div>
              <div className="w-4 h-4 rounded bg-primary-600 dark:bg-primary-600/80"></div>
              <div className="w-4 h-4 rounded bg-primary-800 dark:bg-primary-500"></div>
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
