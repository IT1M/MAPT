'use client';

import React, { useEffect, useState } from 'react';

export interface PageLoaderProps {
  message?: string;
  progress?: number; // 0-100
  timeout?: number; // milliseconds, default 3000
  onTimeout?: () => void;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message,
  progress,
  timeout = 3000,
  onTimeout,
}) => {
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    if (timeout > 0) {
      const timer = setTimeout(() => {
        setShowTimeout(true);
        onTimeout?.();
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [timeout, onTimeout]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center space-y-6 px-4">
        {/* Company Logo */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-primary-600 dark:text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          {/* Spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 animate-spin" />
        </div>

        {/* Progress Bar */}
        <div className="w-64 space-y-2">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 dark:bg-primary-500 transition-all duration-300 ease-out"
              style={{
                width: progress !== undefined ? `${progress}%` : '0%',
                animation: progress === undefined ? 'indeterminate 1.5s ease-in-out infinite' : 'none',
              }}
            />
          </div>
          
          {/* Message */}
          {message && (
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              {message}
            </p>
          )}
        </div>

        {/* Timeout Message */}
        {showTimeout && (
          <div className="mt-4 text-center space-y-2">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              This is taking longer than expected...
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes indeterminate {
          0% {
            transform: translateX(-100%);
            width: 30%;
          }
          50% {
            width: 50%;
          }
          100% {
            transform: translateX(400%);
            width: 30%;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Inline loader for smaller sections
 */
export interface InlineLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const InlineLoader: React.FC<InlineLoaderProps> = ({
  size = 'md',
  message,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <svg
        className={`${sizeClasses[size]} animate-spin text-primary-600 dark:text-primary-400`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      )}
    </div>
  );
};
