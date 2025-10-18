'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error boundary caught:', error)
    }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-danger-100 dark:bg-danger-900/20 mb-4">
            <svg
              className="w-8 h-8 text-danger-600 dark:text-danger-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </p>
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
              <p className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                {error.message}
              </p>
            </div>
          )}
        </div>
        <Button onClick={reset} variant="primary" size="medium">
          Try again
        </Button>
      </div>
    </div>
  )
}
