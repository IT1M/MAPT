'use client';

/**
 * Error Boundary Component
 * 
 * Catches React errors and provides fallback UI while logging errors
 */

import React, { Component, ReactNode } from 'react';
import { logger } from '@/services/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error with component stack
    logger.error('React Error Boundary caught error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback or default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <DefaultErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 */
function DefaultErrorFallback({ error }: { error: Error | null }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
          <svg
            className="w-6 h-6 text-red-600 dark:text-red-400"
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
        <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
          We're sorry, but something unexpected happened. Please try refreshing the page.
        </p>
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm">
            <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300">
              Error Details
            </summary>
            <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}
        <button
          onClick={() => window.location.reload()}
          className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

/**
 * Page-level error boundary with custom styling
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-8">
          <div className="max-w-2xl mx-auto bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Page Error
            </h3>
            <p className="text-red-700 dark:text-red-300">
              This page encountered an error. Please try again or contact support if the problem persists.
            </p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Component-level error boundary for isolated failures
 */
export function ComponentErrorBoundary({ children, componentName }: { children: ReactNode; componentName?: string }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            {componentName ? `${componentName} failed to load` : 'Component failed to load'}
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
