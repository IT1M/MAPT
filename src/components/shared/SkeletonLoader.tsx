'use client'

/**
 * Universal Skeleton Loader Components
 * Provides consistent loading states across the application
 */

import React from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

/**
 * Base Skeleton component
 */
export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700'
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  }
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  }
  
  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height
  
  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      role="status"
      aria-label="Loading..."
    />
  )
}

/**
 * Card Skeleton
 */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="space-y-4">
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="80%" />
        <div className="flex gap-2 mt-4">
          <Skeleton variant="rounded" width={80} height={32} />
          <Skeleton variant="rounded" width={80} height={32} />
        </div>
      </div>
    </div>
  )
}

/**
 * Table Skeleton
 */
export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  className = '' 
}: { 
  rows?: number
  columns?: number
  className?: string 
}) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} variant="text" width={`${100 / columns}%`} height={20} />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} variant="text" width={`${100 / columns}%`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Dashboard Stats Skeleton
 */
export function StatsCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" width="40%" height={16} />
          <Skeleton variant="text" width="60%" height={32} />
        </div>
        <Skeleton variant="circular" width={48} height={48} />
      </div>
      <div className="mt-4">
        <Skeleton variant="text" width="50%" height={14} />
      </div>
    </div>
  )
}

/**
 * Form Skeleton
 */
export function FormSkeleton({ fields = 4, className = '' }: { fields?: number; className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" width="30%" height={16} />
          <Skeleton variant="rounded" width="100%" height={40} />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton variant="rounded" width={100} height={40} />
        <Skeleton variant="rounded" width={100} height={40} />
      </div>
    </div>
  )
}

/**
 * List Skeleton
 */
export function ListSkeleton({ items = 5, className = '' }: { items?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" height={16} />
            <Skeleton variant="text" width="40%" height={14} />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Page Skeleton - Full page loading state
 */
export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton variant="text" width="30%" height={32} />
        <Skeleton variant="text" width="50%" height={20} />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CardSkeleton />
        </div>
        <div>
          <CardSkeleton />
        </div>
      </div>
    </div>
  )
}

/**
 * Inline Loader - Small loading indicator
 */
export function InlineLoader({ size = 'sm', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }
  
  return (
    <div className={`inline-flex items-center justify-center ${className}`} role="status" aria-label="Loading">
      <svg
        className={`animate-spin text-primary-600 dark:text-primary-400 ${sizeClasses[size]}`}
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
    </div>
  )
}

/**
 * Full Page Loader
 */
export function FullPageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
      <div className="text-center">
        <InlineLoader size="lg" className="mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  )
}
