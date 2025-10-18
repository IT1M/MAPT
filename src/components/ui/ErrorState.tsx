'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './button';

export interface ErrorStateProps {
  error?: Error | string;
  title?: string;
  description?: string;
  retry?: () => void;
  showDetails?: boolean;
  showHomeButton?: boolean;
  className?: string;
}

/**
 * ErrorState Component
 * 
 * Displays user-friendly error messages with recovery options
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  title = 'Something went wrong',
  description = 'We encountered an unexpected error. Please try again.',
  retry,
  showDetails = process.env.NODE_ENV === 'development',
  showHomeButton = true,
  className = '',
}) => {
  const router = useRouter();
  const errorMessage = typeof error === 'string' ? error : error?.message;
  const errorStack = typeof error === 'object' && error ? error.stack : undefined;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {/* Error Icon */}
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20">
          <svg
            className="w-8 h-8 text-red-600 dark:text-red-400"
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
      </div>

      {/* Error Title */}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      {/* Error Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6">
        {description}
      </p>

      {/* Error Details (Development Only) */}
      {showDetails && errorMessage && (
        <details className="mb-6 w-full max-w-2xl">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-2">
            Error Details
          </summary>
          <div className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
            <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto whitespace-pre-wrap break-words">
              {errorMessage}
              {errorStack && (
                <>
                  {'\n\n'}
                  {errorStack}
                </>
              )}
            </pre>
          </div>
        </details>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {retry && (
          <Button
            onClick={retry}
            variant="primary"
            size="medium"
          >
            <svg
              className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2"
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
            Try Again
          </Button>
        )}
        
        {showHomeButton && (
          <Button
            onClick={() => router.push('/')}
            variant="secondary"
            size="medium"
          >
            <svg
              className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Go to Dashboard
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * PageErrorState Component
 * 
 * Full-page error state with consistent styling
 */
export const PageErrorState: React.FC<ErrorStateProps> = (props) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-2xl w-full">
        <ErrorState {...props} />
      </div>
    </div>
  );
};

/**
 * InlineErrorState Component
 * 
 * Compact error state for inline use within components
 */
export interface InlineErrorStateProps {
  error?: Error | string;
  message?: string;
  retry?: () => void;
  className?: string;
}

export const InlineErrorState: React.FC<InlineErrorStateProps> = ({
  error,
  message = 'Failed to load content',
  retry,
  className = '',
}) => {
  const errorMessage = typeof error === 'string' ? error : error?.message;

  return (
    <div className={`p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="ml-3 rtl:ml-0 rtl:mr-3 flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            {message}
          </h3>
          {errorMessage && process.env.NODE_ENV === 'development' && (
            <p className="mt-1 text-xs text-red-700 dark:text-red-300">
              {errorMessage}
            </p>
          )}
          {retry && (
            <button
              onClick={retry}
              className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
