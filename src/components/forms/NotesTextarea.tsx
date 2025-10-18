'use client'

import React, { useRef, useEffect } from 'react'

interface NotesTextareaProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  error?: string
  helperText?: string
  maxLength?: number
  id?: string
  name?: string
}

export function NotesTextarea({
  value,
  onChange,
  label,
  placeholder,
  error,
  helperText,
  maxLength = 500,
  id,
  name,
}: NotesTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`

  const charCount = value.length
  const remaining = maxLength - charCount

  // Auto-expand textarea height
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto'
      // Set height to scrollHeight to fit content
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [value])

  const baseStyles =
    'w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 resize-none overflow-hidden min-h-[44px]'

  const normalStyles =
    'border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary-400'

  const errorStyles =
    'border-danger-500 focus:border-danger-500 focus:ring-danger-500 dark:border-danger-400'

  const textareaClassName = `${baseStyles} ${error ? errorStyles : normalStyles}`
  
  // Prevent zoom on iOS by setting font-size to 16px
  const textareaStyle = {
    fontSize: '16px',
  }

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 rtl:text-right"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          id={textareaId}
          name={name}
          value={value}
          onChange={(e) => {
            // Enforce max length
            if (e.target.value.length <= maxLength) {
              onChange(e.target.value)
            }
          }}
          placeholder={placeholder}
          className={textareaClassName}
          style={textareaStyle}
          rows={3}
          maxLength={maxLength}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : helperText
              ? `${textareaId}-helper`
              : undefined
          }
        />
        {error && (
          <div className="absolute top-2 right-2 pointer-events-none">
            <svg
              className="h-5 w-5 text-danger-500 dark:text-danger-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Character Counter and Helper Text */}
      <div className="mt-1 flex justify-between items-start gap-2">
        <div className="flex-1">
          {error && (
            <p
              id={`${textareaId}-error`}
              className="text-sm text-danger-600 dark:text-danger-400 rtl:text-right flex items-start gap-1"
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
          {helperText && !error && (
            <p
              id={`${textareaId}-helper`}
              className="text-sm text-gray-500 dark:text-gray-400 rtl:text-right"
            >
              {helperText}
            </p>
          )}
        </div>

        {/* Character Counter */}
        <div className="flex-shrink-0">
          <span
            className={`text-xs ${
              remaining < 0
                ? 'text-danger-600 dark:text-danger-400'
                : remaining < 50
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            aria-live="polite"
            aria-label={`${remaining} characters remaining`}
          >
            {charCount}/{maxLength}
          </span>
        </div>
      </div>
    </div>
  )
}
