'use client';

/**
 * Error Boundary Component
 *
 * Catches React errors and provides fallback UI while logging errors
 * Enhanced with monitoring service integration and better error recovery
 */

import React, { Component, ReactNode } from 'react';
import { logger } from '@/services/logger';
import { ErrorState } from '@/components/ui/ErrorState';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
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
      timestamp: new Date().toISOString(),
    });

    // Store error info in state
    this.setState({ errorInfo });

    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.logToMonitoringService(error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Log error to external monitoring service
   * This can be integrated with services like Sentry, LogRocket, etc.
   */
  private logToMonitoringService(
    error: Error,
    errorInfo: React.ErrorInfo
  ): void {
    try {
      // Store error in localStorage for debugging
      const errorLog = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent:
          typeof window !== 'undefined'
            ? window.navigator.userAgent
            : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      };

      const existingLogs = JSON.parse(
        localStorage.getItem('error-logs') || '[]'
      );
      existingLogs.push(errorLog);
      // Keep only last 50 errors
      localStorage.setItem(
        'error-logs',
        JSON.stringify(existingLogs.slice(-50))
      );

      // TODO: Integrate with external monitoring service
      // Example: Sentry.captureException(error, { extra: errorInfo });
    } catch (loggingError) {
      console.error('Failed to log error to monitoring service:', loggingError);
    }
  }

  /**
   * Reset error boundary state
   */
  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback or default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 */
function DefaultErrorFallback({
  error,
  onReset,
}: {
  error: Error | null;
  onReset?: () => void;
}) {
  const handleRetry = () => {
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-2xl w-full">
        <ErrorState
          error={error || undefined}
          title="Something went wrong"
          description="We're sorry, but something unexpected happened. Please try again or return to the dashboard."
          retry={handleRetry}
          showDetails={process.env.NODE_ENV === 'development'}
          showHomeButton={true}
        />
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
          <ErrorState
            title="Page Error"
            description="This page encountered an error. Please try again or contact support if the problem persists."
            retry={() => window.location.reload()}
            showHomeButton={true}
            className="max-w-2xl mx-auto"
          />
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
export function ComponentErrorBoundary({
  children,
  componentName,
}: {
  children: ReactNode;
  componentName?: string;
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3 rtl:ml-0 rtl:mr-3">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {componentName
                  ? `${componentName} failed to load`
                  : 'Component failed to load'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-500 dark:hover:text-yellow-300"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
