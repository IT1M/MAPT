'use client'

/**
 * Loading State Components
 * Provides consistent loading indicators and optimistic updates
 */

import React, { useState, useEffect } from 'react'
import { InlineLoader } from './SkeletonLoader'

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  children: React.ReactNode
}

/**
 * Button with loading state
 */
export function LoadingButton({
  loading = false,
  loadingText,
  disabled,
  children,
  className = '',
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`relative ${className} ${loading ? 'cursor-wait' : ''}`}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <InlineLoader size="sm" />
        </span>
      )}
      <span className={loading ? 'invisible' : ''}>
        {loading && loadingText ? loadingText : children}
      </span>
    </button>
  )
}

interface ProgressBarProps {
  progress: number
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
}

/**
 * Progress bar component
 */
export function ProgressBar({
  progress,
  className = '',
  showLabel = false,
  size = 'md',
  variant = 'default',
}: ProgressBarProps) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }
  
  const variantClasses = {
    default: 'bg-primary-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
  }
  
  const clampedProgress = Math.min(100, Math.max(0, progress))
  
  return (
    <div className={className}>
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${sizeClasses[size]} ${variantClasses[variant]} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 text-right">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  )
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  label?: string
}

/**
 * Spinner component
 */
export function Spinner({ size = 'md', className = '', label }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }
  
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        className={`animate-spin text-primary-600 dark:text-primary-400 ${sizeClasses[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        role="status"
        aria-label={label || 'Loading'}
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
      {label && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{label}</p>
      )}
    </div>
  )
}

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  children: React.ReactNode
}

/**
 * Loading overlay for sections
 */
export function LoadingOverlay({ isLoading, message, children }: LoadingOverlayProps) {
  if (!isLoading) return <>{children}</>
  
  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
        <Spinner size="lg" label={message} />
      </div>
    </div>
  )
}

interface OptimisticUpdateProps<T> {
  data: T
  isLoading: boolean
  error?: Error
  children: (data: T, isStale: boolean) => React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Optimistic update wrapper
 */
export function OptimisticUpdate<T>({
  data,
  isLoading,
  error,
  children,
  fallback,
}: OptimisticUpdateProps<T>) {
  const [optimisticData, setOptimisticData] = useState(data)
  const [isStale, setIsStale] = useState(false)
  
  useEffect(() => {
    if (isLoading) {
      setIsStale(true)
    } else {
      setOptimisticData(data)
      setIsStale(false)
    }
  }, [data, isLoading])
  
  if (error && fallback) {
    return <>{fallback}</>
  }
  
  return <>{children(optimisticData, isStale)}</>
}

interface DelayedLoaderProps {
  delay?: number
  children: React.ReactNode
}

/**
 * Delayed loader to prevent flash of loading state
 */
export function DelayedLoader({ delay = 300, children }: DelayedLoaderProps) {
  const [show, setShow] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(timer)
  }, [delay])
  
  if (!show) return null
  
  return <>{children}</>
}

interface LoadingDotsProps {
  className?: string
}

/**
 * Animated loading dots
 */
export function LoadingDots({ className = '' }: LoadingDotsProps) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

interface PulseLoaderProps {
  count?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Pulse loader animation
 */
export function PulseLoader({ count = 3, size = 'md', className = '' }: PulseLoaderProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }
  
  return (
    <div className={`flex space-x-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} bg-primary-600 dark:bg-primary-400 rounded-full animate-pulse`}
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}
    </div>
  )
}

interface SkeletonTextProps {
  lines?: number
  className?: string
}

/**
 * Skeleton text loader
 */
export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          style={{ width: i === lines - 1 ? '80%' : '100%' }}
        />
      ))}
    </div>
  )
}

interface LoadingStateProps {
  isLoading: boolean
  error?: Error
  isEmpty?: boolean
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
  emptyComponent?: React.ReactNode
  children: React.ReactNode
}

/**
 * Comprehensive loading state manager
 */
export function LoadingState({
  isLoading,
  error,
  isEmpty,
  loadingComponent,
  errorComponent,
  emptyComponent,
  children,
}: LoadingStateProps) {
  if (isLoading) {
    return <>{loadingComponent || <Spinner size="lg" label="Loading..." />}</>
  }
  
  if (error) {
    return (
      <>
        {errorComponent || (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">Error: {error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        )}
      </>
    )
  }
  
  if (isEmpty) {
    return (
      <>
        {emptyComponent || (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No data available
          </div>
        )}
      </>
    )
  }
  
  return <>{children}</>
}
