/**
 * Error Reporting Utility
 *
 * Provides utilities for reporting and tracking errors across the application
 */

import { logger } from '@/services/logger';

export interface ErrorReport {
  message: string;
  error: Error | unknown;
  context?: Record<string, any>;
  userId?: string;
  url?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Report an error with full context
 */
export function reportError(
  message: string,
  error: Error | unknown,
  context?: Record<string, any>
): void {
  const errorReport: ErrorReport = {
    message,
    error,
    context,
    timestamp: new Date(),
    ...(typeof window !== 'undefined' && {
      url: window.location.href,
      userAgent: navigator.userAgent,
    }),
  };

  // Log to centralized logger
  logger.error(message, error, {
    ...context,
    url: errorReport.url,
    userAgent: errorReport.userAgent,
  });

  // In production, you might want to send to external service
  if (process.env.NODE_ENV === 'production') {
    sendToErrorTrackingService(errorReport);
  }
}

/**
 * Send error to external tracking service (Sentry, Datadog, etc.)
 */
function sendToErrorTrackingService(report: ErrorReport): void {
  // This is a placeholder for integration with services like:
  // - Sentry
  // - Datadog
  // - Rollbar
  // - Bugsnag
  // Example for future Sentry integration:
  // if (typeof window !== 'undefined' && window.Sentry) {
  //   window.Sentry.captureException(report.error, {
  //     contexts: {
  //       custom: report.context,
  //     },
  //     tags: {
  //       url: report.url,
  //     },
  //   });
  // }
}

/**
 * Setup global error handlers
 */
export function setupGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    reportError('Unhandled Promise Rejection', event.reason, {
      promise: event.promise,
      type: 'unhandledrejection',
    });
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    reportError('Global Error', event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: 'error',
    });
  });

  // Log when handlers are set up
  logger.info('Global error handlers initialized');
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Report error with severity level
 */
export function reportErrorWithSeverity(
  message: string,
  error: Error | unknown,
  severity: ErrorSeverity,
  context?: Record<string, any>
): void {
  reportError(message, error, {
    ...context,
    severity,
  });

  // For critical errors, you might want to trigger alerts
  if (severity === ErrorSeverity.CRITICAL) {
    triggerCriticalErrorAlert(message, error);
  }
}

/**
 * Trigger alert for critical errors
 */
function triggerCriticalErrorAlert(
  message: string,
  error: Error | unknown
): void {
  // This could send notifications via:
  // - Email
  // - Slack
  // - PagerDuty
  // - SMS

  logger.error('CRITICAL ERROR ALERT', error, {
    message,
    alert: true,
    critical: true,
  });
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorMessage?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      reportError(
        errorMessage || `Error in ${fn.name || 'anonymous function'}`,
        error,
        {
          functionName: fn.name,
          arguments: args,
        }
      );
      throw error;
    }
  }) as T;
}

/**
 * Wrap sync function with error handling
 */
export function withSyncErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  errorMessage?: string
): T {
  return ((...args: Parameters<T>) => {
    try {
      return fn(...args);
    } catch (error) {
      reportError(
        errorMessage || `Error in ${fn.name || 'anonymous function'}`,
        error,
        {
          functionName: fn.name,
          arguments: args,
        }
      );
      throw error;
    }
  }) as T;
}
