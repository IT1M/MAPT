/**
 * ProgressBar Component
 * Reusable progress indicator with percentage, step description, and estimated time
 */

'use client';

import React from 'react';

interface ProgressBarProps {
  percentage: number;
  currentStep?: string;
  estimatedTime?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red';
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  percentage,
  currentStep,
  estimatedTime,
  showPercentage = true,
  size = 'md',
  color = 'blue',
  animated = true,
  className = '',
}: ProgressBarProps) {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  // Size classes
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  // Color classes
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Header with step and percentage */}
      {(currentStep || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {currentStep && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {currentStep}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {clampedPercentage}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div
        className={`
          w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden
          ${sizeClasses[size]}
        `}
      >
        <div
          className={`
            ${colorClasses[color]} 
            ${sizeClasses[size]} 
            rounded-full transition-all duration-500 ease-out
            ${animated ? 'animate-pulse' : ''}
          `}
          style={{ width: `${clampedPercentage}%` }}
          role="progressbar"
          aria-valuenow={clampedPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Estimated time */}
      {estimatedTime && (
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          Estimated time remaining: {estimatedTime}
        </div>
      )}
    </div>
  );
}

interface ProgressStepsProps {
  steps: {
    label: string;
    status: 'pending' | 'active' | 'completed' | 'error';
  }[];
  className?: string;
}

export function ProgressSteps({ steps, className = '' }: ProgressStepsProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-3">
          {/* Status icon */}
          <div
            className={`
              flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
              ${
                step.status === 'completed'
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : step.status === 'active'
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : step.status === 'error'
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : 'bg-gray-100 dark:bg-gray-700'
              }
            `}
          >
            {step.status === 'completed' && (
              <svg
                className="w-4 h-4 text-green-600 dark:text-green-400"
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
            )}
            {step.status === 'active' && (
              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
            )}
            {step.status === 'error' && (
              <svg
                className="w-4 h-4 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            {step.status === 'pending' && (
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full" />
            )}
          </div>

          {/* Step label */}
          <span
            className={`
              text-sm
              ${
                step.status === 'active'
                  ? 'font-medium text-gray-900 dark:text-gray-100'
                  : step.status === 'completed'
                  ? 'text-gray-700 dark:text-gray-300'
                  : step.status === 'error'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-500'
              }
            `}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default ProgressBar;
