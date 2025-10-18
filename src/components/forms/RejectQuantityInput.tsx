'use client'

import React, { useMemo, useCallback } from 'react'
import { Input, InputProps } from '@/components/ui/input'

interface RejectQuantityInputProps extends Omit<InputProps, 'onChange'> {
  value: string
  quantity: string
  onChange: (value: string) => void
}

export const RejectQuantityInput = React.memo(function RejectQuantityInput({
  value,
  quantity,
  onChange,
  error,
  ...props
}: RejectQuantityInputProps) {
  // Memoize reject percentage calculation (expensive calculation)
  const { percentage, colorClass, bgClass, textClass } = useMemo(() => {
    const rejectNum = parseInt(value) || 0
    const quantityNum = parseInt(quantity) || 0

    if (quantityNum === 0 || rejectNum === 0) {
      return {
        percentage: 0,
        colorClass: 'text-gray-500 dark:text-gray-400',
        bgClass: 'bg-gray-100 dark:bg-gray-800',
        textClass: 'text-gray-800 dark:text-gray-200',
      }
    }

    const pct = (rejectNum / quantityNum) * 100

    let colorClass = ''
    let bgClass = ''
    let textClass = ''

    if (pct < 5) {
      // Green for < 5%
      colorClass = 'text-green-600 dark:text-green-400'
      bgClass = 'bg-green-100 dark:bg-green-900'
      textClass = 'text-green-800 dark:text-green-200'
    } else if (pct <= 10) {
      // Yellow for 5-10%
      colorClass = 'text-yellow-600 dark:text-yellow-400'
      bgClass = 'bg-yellow-100 dark:bg-yellow-900'
      textClass = 'text-yellow-800 dark:text-yellow-200'
    } else {
      // Red for > 10%
      colorClass = 'text-red-600 dark:text-red-400'
      bgClass = 'bg-red-100 dark:bg-red-900'
      textClass = 'text-red-800 dark:text-red-200'
    }

    return {
      percentage: pct,
      colorClass,
      bgClass,
      textClass,
    }
  }, [value, quantity])

  // Memoize validation error calculation
  const validationError = useMemo(() => {
    const rejectNum = parseInt(value) || 0
    const quantityNum = parseInt(quantity) || 0

    if (rejectNum > quantityNum && quantityNum > 0) {
      return 'Reject quantity cannot exceed total quantity'
    }

    return null
  }, [value, quantity])

  // Memoize onChange handler
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  const displayError = error || validationError || undefined

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            type="number"
            min="0"
            value={value}
            onChange={handleChange}
            error={displayError}
            inputMode="numeric"
            {...props}
          />
        </div>

        {/* Percentage Indicator Badge */}
        {parseInt(value) > 0 && parseInt(quantity) > 0 && (
          <div
            className={`flex-shrink-0 px-3 py-2 rounded-lg font-semibold text-sm ${bgClass} ${textClass} min-w-[80px] text-center`}
            role="status"
            aria-label={`Reject percentage: ${percentage.toFixed(1)}%`}
          >
            {percentage.toFixed(1)}%
          </div>
        )}
      </div>

      {/* Helper text when no percentage shown */}
      {(!value || parseInt(value) === 0) && !displayError && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Number of damaged or unusable items
        </p>
      )}
    </div>
  )
})
