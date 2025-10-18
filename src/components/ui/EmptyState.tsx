'use client';

import React from 'react';
import Link from 'next/link';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  illustration?: 'no-data' | 'no-results' | 'no-access' | 'error';
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  illustration,
  action,
  className = '',
}) => {
  const renderIllustration = () => {
    if (icon) return icon;

    const iconClasses = 'w-16 h-16';
    
    switch (illustration) {
      case 'no-data':
        return (
          <svg
            className={`${iconClasses} text-gray-400 dark:text-gray-600`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        );
      
      case 'no-results':
        return (
          <svg
            className={`${iconClasses} text-gray-400 dark:text-gray-600`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        );
      
      case 'no-access':
        return (
          <svg
            className={`${iconClasses} text-yellow-500 dark:text-yellow-600`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        );
      
      case 'error':
        return (
          <svg
            className={`${iconClasses} text-red-500 dark:text-red-600`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      
      default:
        return (
          <svg
            className={`${iconClasses} text-gray-400 dark:text-gray-600`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
    }
  };

  const renderAction = () => {
    if (!action) return null;

    const buttonClasses = 'inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500';

    if (action.href) {
      return (
        <Link href={action.href} className={buttonClasses}>
          {action.label}
        </Link>
      );
    }

    return (
      <button onClick={action.onClick} className={buttonClasses}>
        {action.label}
      </button>
    );
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="mb-4">{renderIllustration()}</div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6">
          {description}
        </p>
      )}
      
      {renderAction()}
    </div>
  );
};

/**
 * Specialized empty state for tables
 */
export interface TableEmptyStateProps {
  title?: string;
  description?: string;
  action?: EmptyStateProps['action'];
  hasFilters?: boolean;
  onResetFilters?: () => void;
}

export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  title,
  description,
  action,
  hasFilters = false,
  onResetFilters,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <EmptyState
        illustration={hasFilters ? 'no-results' : 'no-data'}
        title={title || (hasFilters ? 'No results found' : 'No data available')}
        description={
          description ||
          (hasFilters
            ? 'Try adjusting your filters to find what you\'re looking for'
            : 'Get started by adding your first item')
        }
        action={
          hasFilters && onResetFilters
            ? { label: 'Reset Filters', onClick: onResetFilters }
            : action
        }
        className="py-16"
      />
    </div>
  );
};

/**
 * Specialized empty state for notifications
 */
export const NotificationsEmptyState: React.FC = () => {
  return (
    <EmptyState
      icon={
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      }
      title="You're all caught up!"
      description="No new notifications at this time"
      className="py-8"
    />
  );
};

/**
 * Specialized empty state for search results
 */
export interface SearchEmptyStateProps {
  searchQuery: string;
  onClearSearch?: () => void;
}

export const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({
  searchQuery,
  onClearSearch,
}) => {
  return (
    <EmptyState
      illustration="no-results"
      title={`No results for "${searchQuery}"`}
      description="Try different keywords or check your spelling"
      action={
        onClearSearch
          ? { label: 'Clear Search', onClick: onClearSearch }
          : undefined
      }
    />
  );
};

/**
 * Specialized empty state for error scenarios
 */
export interface ErrorEmptyStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorEmptyState: React.FC<ErrorEmptyStateProps> = ({
  title = 'Something went wrong',
  description = 'We encountered an error while loading this content',
  onRetry,
}) => {
  return (
    <EmptyState
      illustration="error"
      title={title}
      description={description}
      action={onRetry ? { label: 'Try Again', onClick: onRetry } : undefined}
    />
  );
};
