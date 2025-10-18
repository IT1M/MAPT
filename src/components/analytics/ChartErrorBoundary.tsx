'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  chartName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Chart Error Boundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ChartErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
          chartName={this.props.chartName}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Default Error Fallback Component
// ============================================================================

interface ChartErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
  chartName?: string;
}

const ChartErrorFallback: React.FC<ChartErrorFallbackProps> = ({
  error,
  onReset,
  chartName,
}) => {
  return (
    <Card>
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          {/* Error Icon */}
          <div className="text-6xl">⚠️</div>

          {/* Error Message */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {chartName ? `${chartName} Error` : 'Chart Error'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Unable to display this chart. Please try again.
            </p>
            {error && process.env.NODE_ENV === 'development' && (
              <details className="text-left mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto">
                  {error.message}
                  {'\n\n'}
                  {error.stack}
                </pre>
              </details>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onReset}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ============================================================================
// Lightweight Error Boundary Hook (for functional components)
// ============================================================================

export function useErrorHandler(): (error: Error) => void {
  const [, setError] = React.useState<Error | null>(null);

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}
