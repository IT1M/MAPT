/**
 * MobileCardView Component
 * Responsive card layout for mobile devices
 * Used for audit entries, backups, and reports on small screens
 */

'use client';

import React from 'react';

interface MobileCardViewProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCardView({
  children,
  className = '',
}: MobileCardViewProps) {
  return (
    <div
      className={`
        bg-white dark:bg-gray-800 
        rounded-lg shadow-sm 
        border border-gray-200 dark:border-gray-700
        p-4 mb-3
        hover:shadow-md transition-shadow
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface CardRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function CardRow({ label, value, className = '' }: CardRowProps) {
  return (
    <div
      className={`flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 ${className}`}
    >
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex-shrink-0 mr-3">
        {label}
      </span>
      <span className="text-sm text-gray-900 dark:text-gray-100 text-right">
        {value}
      </span>
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export function CardHeader({
  title,
  subtitle,
  badge,
  actions,
}: CardHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
            {title}
          </h3>
          {badge}
        </div>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex-shrink-0 ml-3">{actions}</div>}
    </div>
  );
}

interface CardActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function CardActions({ children, className = '' }: CardActionsProps) {
  return (
    <div
      className={`flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 ${className}`}
    >
      {children}
    </div>
  );
}

interface CardSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function CardSection({
  title,
  children,
  className = '',
}: CardSectionProps) {
  return (
    <div className={`mt-3 ${className}`}>
      {title && (
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {title}
        </h4>
      )}
      {children}
    </div>
  );
}

// Export all components
export default MobileCardView;
