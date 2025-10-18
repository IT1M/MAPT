/**
 * Client-side API Error Handler
 * 
 * Handles API errors on the client side with appropriate user feedback
 * and navigation
 */

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
}

export interface ApiErrorHandlerOptions {
  router?: AppRouterInstance;
  locale?: string;
  showToast?: (message: string, type: 'error' | 'success' | 'warning' | 'info') => void;
  onUnauthorized?: () => void;
  onForbidden?: () => void;
  onNotFound?: () => void;
  onServerError?: () => void;
  onNetworkError?: () => void;
}

/**
 * Parse API error response
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  let message = 'An error occurred';
  let code: string | undefined;
  let details: any;

  try {
    const data = await response.json();
    message = data.error?.message || data.message || message;
    code = data.error?.code || data.code;
    details = data.error?.details || data.details;
  } catch {
    // If response is not JSON, use status text
    message = response.statusText || message;
  }

  return {
    status: response.status,
    message,
    code,
    details,
  };
}

/**
 * Handle API errors with appropriate actions
 */
export async function handleApiError(
  error: unknown,
  options: ApiErrorHandlerOptions = {}
): Promise<void> {
  const {
    router,
    locale = 'en',
    showToast,
    onUnauthorized,
    onForbidden,
    onNotFound,
    onServerError,
    onNetworkError,
  } = options;

  // Handle Response objects
  if (error instanceof Response) {
    const apiError = await parseApiError(error);

    switch (apiError.status) {
      case 401:
        // Unauthorized - redirect to login
        if (showToast) {
          showToast('Your session has expired. Please sign in again.', 'warning');
        }
        if (onUnauthorized) {
          onUnauthorized();
        } else if (router) {
          const currentPath = window.location.pathname;
          router.push(`/${locale}/login?callbackUrl=${encodeURIComponent(currentPath)}`);
        }
        break;

      case 403:
        // Forbidden - redirect to access denied
        if (showToast) {
          showToast('You don\'t have permission to perform this action.', 'error');
        }
        if (onForbidden) {
          onForbidden();
        } else if (router) {
          const currentPath = window.location.pathname;
          router.push(`/${locale}/access-denied?path=${encodeURIComponent(currentPath)}`);
        }
        break;

      case 404:
        // Not Found - show toast
        if (showToast) {
          showToast(apiError.message || 'Resource not found.', 'error');
        }
        if (onNotFound) {
          onNotFound();
        }
        break;

      case 422:
        // Validation Error - show toast with details
        if (showToast) {
          const validationMessage = apiError.details
            ? `Validation failed: ${JSON.stringify(apiError.details)}`
            : apiError.message || 'Validation failed. Please check your input.';
          showToast(validationMessage, 'error');
        }
        break;

      case 429:
        // Rate Limit - show toast
        if (showToast) {
          showToast('Too many requests. Please try again later.', 'warning');
        }
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        // Server Error - show toast
        if (showToast) {
          showToast(
            apiError.message || 'Server error. Please try again later.',
            'error'
          );
        }
        if (onServerError) {
          onServerError();
        }
        break;

      default:
        // Generic error
        if (showToast) {
          showToast(apiError.message || 'An error occurred. Please try again.', 'error');
        }
    }

    return;
  }

  // Handle network errors (TypeError, etc.)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    if (showToast) {
      showToast('Network error. Please check your connection.', 'error');
    }
    if (onNetworkError) {
      onNetworkError();
    }
    return;
  }

  // Handle generic errors
  if (error instanceof Error) {
    if (showToast) {
      showToast(error.message || 'An unexpected error occurred.', 'error');
    }
    console.error('API Error:', error);
    return;
  }

  // Unknown error type
  if (showToast) {
    showToast('An unexpected error occurred.', 'error');
  }
  console.error('Unknown API Error:', error);
}

/**
 * Fetch wrapper with automatic error handling
 */
export async function fetchWithErrorHandling(
  url: string,
  options: RequestInit = {},
  errorHandlerOptions: ApiErrorHandlerOptions = {}
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      await handleApiError(response, errorHandlerOptions);
      throw response;
    }

    return response;
  } catch (error) {
    if (!(error instanceof Response)) {
      await handleApiError(error, errorHandlerOptions);
    }
    throw error;
  }
}

/**
 * Network status monitor
 */
export class NetworkStatusMonitor {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.notifyListeners();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notifyListeners();
  };

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  public subscribe(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStatus(): boolean {
    return this.isOnline;
  }

  public destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    this.listeners.clear();
  }
}

// Singleton instance
let networkMonitor: NetworkStatusMonitor | null = null;

export function getNetworkMonitor(): NetworkStatusMonitor {
  if (!networkMonitor) {
    networkMonitor = new NetworkStatusMonitor();
  }
  return networkMonitor;
}

/**
 * Form validation error handler
 */
export interface FormValidationError {
  field: string;
  message: string;
}

export function handleFormValidationErrors(
  errors: FormValidationError[],
  setFieldError?: (field: string, message: string) => void
): void {
  errors.forEach(error => {
    if (setFieldError) {
      setFieldError(error.field, error.message);
    }
  });

  // Scroll to first error
  if (errors.length > 0 && typeof document !== 'undefined') {
    const firstErrorField = document.querySelector(`[name="${errors[0].field}"]`);
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add shake animation
      firstErrorField.classList.add('animate-shake');
      setTimeout(() => {
        firstErrorField.classList.remove('animate-shake');
      }, 500);
    }
  }
}

/**
 * Retry helper with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error instanceof Response && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
