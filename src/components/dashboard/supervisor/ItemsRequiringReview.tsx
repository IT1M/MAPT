'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ItemForReview {
  id: string
  itemName: string
  batch: string
  quantity: number
  rejectQuantity: number
  enteredBy: string
  createdAt: string
  flagReason: string
}

export function ItemsRequiringReview() {
  const router = useRouter()
  const [items, setItems] = useState<ItemForReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchItemsForReview()
  }, [])

  const fetchItemsForReview = async () => {
    try {
      const response = await fetch('/api/dashboard/items-for-review')
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Failed to fetch items for review:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Items Requiring Review
        </h3>
        {items.length > 0 && (
          <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 text-xs font-medium rounded-full">
            {items.length} pending
          </span>
        )}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No items requiring review</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors cursor-pointer"
              onClick={() => router.push(`/inventory/${item.id}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.itemName}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Batch: {item.batch} • By: {item.enteredBy}
                  </p>
                </div>
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-700 dark:text-gray-300 mb-2">
                <span>Qty: {item.quantity}</span>
                <span className="text-red-600 dark:text-red-400">
                  Rejected: {item.rejectQuantity}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                  {item.flagReason}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
