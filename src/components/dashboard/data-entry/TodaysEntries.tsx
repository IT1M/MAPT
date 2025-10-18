'use client'

import { useEffect, useState } from 'react'

interface TodayEntry {
  id: string
  itemName: string
  batch: string
  quantity: number
  destination: string
  createdAt: string
}

export function TodaysEntries() {
  const [entries, setEntries] = useState<TodayEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodaysEntries()
  }, [])

  const fetchTodaysEntries = async () => {
    try {
      const response = await fetch('/api/dashboard/my-entries-today')
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error('Failed to fetch today\'s entries:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Today's Entries
        </h3>
        <span className="px-3 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400 text-sm font-medium rounded-full">
          {entries.length} items
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No entries yet today</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Start adding items to see them here</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {entry.itemName}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Batch: {entry.batch}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                  entry.destination === 'MAIS'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {entry.destination}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Qty: {entry.quantity}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(entry.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
