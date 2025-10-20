/**
 * Enhanced Error Handling Utilities
 * Provides comprehensive error handling with retry logic and user-friendly messages
 */

import { logger } from '@/services/logger';

export interface ErrorHandlerOptions {
  retry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number) => void;
  onError?: (error: Error) => void;
  fallback?: any;
  context?: Record<string, any>;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

/**
 * Create a user-friendly error message
 */
export function getUserFriendlyMessage(error: Error | ApiError): string {
  // Check for specific error types
  if ('status' in error) {
    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'You are not authenticated. Please log in and try again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This action conflicts with existing data.';
      case 422:
        return 'The data provided is invalid. Please check and try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'A server error occurred. Please try again later.';
      case 503:
        return 'The service is temporarily unavailable. Please try again later.';
      default:
        if (error.status && error.status >= 500) {
          return 'A server error occurred. Please try again later.';
        }
    }
  }

  // Check for network errors
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Check for timeout errors
  if (error.message.includes('timeout')) {
    return 'The request timed out. Please try again.';
  }

  // Default message
  return error.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: ErrorHandlerOptions = {}
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000, onRetry, onError } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        // Calculate delay with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt);

        logger.warn(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`,
          {
            error: lastError.message,
          }
        );

        if (onRetry) {
          onRetry(attempt + 1);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  if (onError) {
    onError(lastError!);
  }

  throw lastError!;
}

/**
 * Handle API errors with retry logic
 */
export async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  options: ErrorHandlerOptions = {}
): Promise<T> {
  const { retry = true, maxRetries = 3, fallback, context = {} } = options;

  try {
    if (retry) {
      return await retryWithBackoff(apiCall, options);
    } else {
      return await apiCall();
    }
  } catch (error) {
    const apiError = error as ApiError;

    // Log error with context
    logger.error('API call failed', apiError, {
      ...context,
      status: apiError.status,
      code: apiError.code,
    });

    // Return fallback if provided
    if (fallback !== undefined) {
      return fallback;
    }

    // Re-throw error
    throw apiError;
  }
}

/**
 * Create a safe async function that catches errors
 */
export function createSafeAsync<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: ErrorHandlerOptions = {}
): (...args: T) => Promise<R | undefined> {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (error) {
      const err = error as Error;

      logger.error('Safe async function error', err, options.context);

      if (options.onError) {
        options.onError(err);
      }

      return options.fallback;
    }
  };
}

/**
 * Error boundary for async operations
 */
export class AsyncErrorBoundary {
  private errors: Error[] = [];
  private maxErrors: number;

  constructor(maxErrors = 10) {
    this.maxErrors = maxErrors;
  }

  async execute<T>(
    fn: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | undefined> {
    try {
      return await fn();
    } catch (error) {
      const err = error as Error;

      // Store error
      this.errors.push(err);
      if (this.errors.length > this.maxErrors) {
        this.errors.shift();
      }

      // Log error
      logger.error('Async error boundary caught error', err, options.context);

      // Call error handler
      if (options.onError) {
        options.onError(err);
      }

      return options.fallback;
    }
  }

  getErrors(): Error[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }
}

/**
 * Validate response and throw error if invalid
 */
export async function validateResponse(response: Response): Promise<Response> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorDetails: any;

    try {
      const data = await response.json();
      errorMessage = data.message || data.error || errorMessage;
      errorDetails = data;
    } catch {
      // Response is not JSON
    }

    const error = new Error(errorMessage) as ApiError;
    error.status = response.status;
    error.details = errorDetails;

    throw error;
  }

  return response;
}

/**
 * Create an error with additional context
 */
export function createError(
  message: string,
  options: {
    status?: number;
    code?: string;
    details?: any;
    cause?: Error;
  } = {}
): ApiError {
  const error = new Error(message) as ApiError;

  if (options.status) error.status = options.status;
  if (options.code) error.code = options.code;
  if (options.details) error.details = options.details;
  if (options.cause) error.cause = options.cause;

  return error;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error | ApiError): boolean {
  if ('status' in error) {
    // Retry on server errors and rate limiting
    return error.status === 429 || (error.status >= 500 && error.status < 600);
  }

  // Retry on network errors
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return true;
  }

  return false;
}

/**
 * Format error for display
 */
export function formatError(error: Error | ApiError): {
  title: string;
  message: string;
  details?: string;
  canRetry: boolean;
} {
  return {
    title: 'Error',
    message: getUserFriendlyMessage(error),
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    canRetry: isRetryableError(error),
  };
}

/**
 * Global error handler for unhandled promise rejections
 */
export function setupGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason);

    // Prevent default browser behavior
    event.preventDefault();
  });

  window.addEventListener('error', (event) => {
    logger.error('Global error', event.error);
  });
}
