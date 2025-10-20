'use client';

import { useEffect, useState } from 'react';

interface UserBehavior {
  userId: string;
  userName: string;
  activityScore: number;
  anomalyDetected: boolean;
  lastActive: string;
  topActions: Array<{
    action: string;
    count: number;
  }>;
}

export function UserBehaviorAnalysis() {
  const [users, setUsers] = useState<UserBehavior[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserBehavior();
  }, []);

  const fetchUserBehavior = async () => {
    try {
      const response = await fetch('/api/dashboard/user-behavior');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch user behavior:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        User Behavior Analysis
      </h3>

      <div className="space-y-4">
        {users.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No user behavior data available
          </p>
        ) : (
          users.map((user) => (
            <div
              key={user.userId}
              className={`border rounded-lg p-4 ${
                user.anomalyDetected
                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.userName}
                    </h4>
                    {user.anomalyDetected && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 text-xs font-medium rounded-full flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Anomaly
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Last active: {new Date(user.lastActive).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Activity Score
                  </p>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {user.activityScore}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Top Actions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {user.topActions.map((action, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                    >
                      {action.action} ({action.count})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
