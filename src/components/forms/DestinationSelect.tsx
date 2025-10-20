'use client';

import React from 'react';
import { Destination } from '@prisma/client';

interface DestinationSelectProps {
  value: Destination;
  onChange: (value: Destination) => void;
  label?: string;
  error?: string;
  lastUsed?: Destination;
  required?: boolean;
}

export function DestinationSelect({
  value,
  onChange,
  label,
  error,
  lastUsed,
  required = false,
}: DestinationSelectProps) {
  const groupId = `destination-group-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${groupId}-error`;
  const destinations: Array<{
    value: Destination;
    label: string;
    icon: string;
  }> = [
    { value: 'MAIS', label: 'Mais', icon: '🏢' },
    { value: 'FOZAN', label: 'Fozan', icon: '🏭' },
  ];

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl:text-right">
          {label}
          {lastUsed && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              (Last used: {lastUsed})
            </span>
          )}
        </label>
      )}

      <div
        id={groupId}
        role="radiogroup"
        aria-label="Destination selection"
        aria-required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {destinations.map((destination) => {
          const isSelected = value === destination.value;
          const isLastUsed = lastUsed === destination.value;

          return (
            <button
              key={destination.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(destination.value)}
              className={`
                relative flex items-center justify-center gap-2 px-6 py-4
                min-h-[44px] min-w-[44px] rounded-lg font-semibold text-base
                transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${
                  isSelected
                    ? 'bg-primary-600 text-white border-2 border-primary-600 shadow-lg scale-105 focus:ring-primary-500'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-primary-500'
                }
                ${error ? 'border-danger-500' : ''}
              `}
            >
              {/* Icon */}
              <span className="text-2xl" aria-hidden="true">
                {destination.icon}
              </span>

              {/* Label */}
              <span>{destination.label}</span>

              {/* Selected Indicator */}
              {isSelected && (
                <span className="absolute top-2 right-2" aria-hidden="true">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}

              {/* Last Used Badge */}
              {isLastUsed && !isSelected && (
                <span
                  className="absolute top-2 right-2 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded"
                  aria-label="Last used destination"
                >
                  Last
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <p
          id={errorId}
          className="mt-2 text-sm text-danger-600 dark:text-danger-400 rtl:text-right flex items-start gap-1"
          role="alert"
          aria-live="polite"
        >
          <svg
            className="w-4 h-4 mt-0.5 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
