'use client'

import React, { useState, useRef } from 'react'
import { Input, InputProps } from '@/components/ui/input'

interface BatchNumberInputProps extends Omit<InputProps, 'onChange' | 'onBlur'> {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  warning?: string
}

export function BatchNumberInput({
  value,
  onChange,
  onBlur,
  error,
  warning,
  ...props
}: BatchNumberInputProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [batchWarning, setBatchWarning] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const charCount = value.length
  const maxChars = 50
  const minChars = 3

  // Transform to uppercase and validate alphanumeric
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Only allow alphanumeric characters and hyphens
    const sanitized = inputValue.replace(/[^A-Za-z0-9-]/g, '')
    const uppercase = sanitized.toUpperCase()
    onChange(uppercase)
  }

  // Check for duplicate batch on blur
  const handleBlur = async () => {
    onBlur?.()

    // Only check if value is valid length
    if (value.length < minChars || value.length > maxChars) {
      setBatchWarning(null)
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setIsChecking(true)
    setBatchWarning(null)
    abortControllerRef.current = new AbortController()

    try {
      const params = new URLSearchParams({ batch: value })
      const response = await fetch(`/api/inventory/check-batch?${params}`, {
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to check batch')
      }

      const result = await response.json()

      if (result.success && result.data?.exists) {
        const itemInfo = result.data.item
        const createdDate = itemInfo?.createdAt
          ? new Date(itemInfo.createdAt).toLocaleDateString()
          : 'unknown date'
        setBatchWarning(
          `Warning: Batch "${value}" already exists (created ${createdDate})`
        )
      } else {
        setBatchWarning(null)
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to check batch:', err)
        setBatchWarning(null)
      }
    } finally {
      setIsChecking(false)
    }
  }

  const displayWarning = warning || batchWarning

  return (
    <div className="w-full">
      <Input
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        error={error}
        {...props}
      />

      {/* Character Counter */}
      <div className="mt-1 flex justify-between items-center text-xs">
        <span
          className={`${
            charCount < minChars || charCount > maxChars
              ? 'text-danger-600 dark:text-danger-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {charCount}/{maxChars} characters
        </span>
        {isChecking && (
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <svg
              className="animate-spin h-3 w-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Checking...
          </span>
        )}
      </div>

      {/* Warning Message (non-blocking) */}
      {displayWarning && !error && (
        <div 
          className="mt-1 flex items-start gap-1 text-sm text-yellow-600 dark:text-yellow-400"
          role="status"
          aria-live="polite"
        >
          <svg
            className="w-4 h-4 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{displayWarning}</span>
        </div>
      )}
    </div>
  )
}
