'use client'

import React, { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
  className?: string
  showJumpToPage?: boolean
  showItemsPerPage?: boolean
  itemsPerPageOptions?: number[]
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className = '',
  showJumpToPage = true,
  showItemsPerPage = true,
  itemsPerPageOptions = [10, 25, 50, 100, 200],
}) => {
  const t = useTranslations()
  const [jumpToPageValue, setJumpToPageValue] = useState('')

  // Calculate the range of items being displayed
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Generate page numbers to display (show 5 at a time with ellipsis)
  const getPageNumbers = useCallback(() => {
    const pages: (number | string)[] = []
    const maxPagesToShow = 5
    
    if (totalPages <= maxPagesToShow + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)
      
      // Adjust if we're near the start
      if (currentPage <= 3) {
        endPage = maxPagesToShow - 1
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - (maxPagesToShow - 2)
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push('...')
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push('...')
      }
      
      // Always show last page
      pages.push(totalPages)
    }
    
    return pages
  }, [currentPage, totalPages])

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page)
    }
  }, [currentPage, totalPages, onPageChange])

  // Handle previous page
  const handlePrevious = useCallback(() => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1)
    }
  }, [currentPage, handlePageChange])

  // Handle next page
  const handleNext = useCallback(() => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1)
    }
  }, [currentPage, totalPages, handlePageChange])

  // Handle jump to page
  const handleJumpToPage = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const page = parseInt(jumpToPageValue, 10)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      handlePageChange(page)
      setJumpToPageValue('')
    }
  }, [jumpToPageValue, totalPages, handlePageChange])

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((value: number) => {
    onItemsPerPageChange(value)
    // Reset to page 1 when changing page size
    if (currentPage !== 1) {
      onPageChange(1)
    }
  }, [currentPage, onPageChange, onItemsPerPageChange])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        handlePrevious()
        break
      case 'ArrowRight':
        e.preventDefault()
        handleNext()
        break
      case 'Home':
        e.preventDefault()
        handlePageChange(1)
        break
      case 'End':
        e.preventDefault()
        handlePageChange(totalPages)
        break
    }
  }, [handlePrevious, handleNext, handlePageChange, totalPages])

  const pageNumbers = getPageNumbers()

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Items count and per-page selector */}
      <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
        <div className="whitespace-nowrap">
          Showing <span className="font-medium">{startItem}</span> to{' '}
          <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{totalItems.toLocaleString()}</span> items
        </div>
        
        {showItemsPerPage && (
          <div className="flex items-center gap-2">
            <label htmlFor="items-per-page" className="whitespace-nowrap">
              Items per page:
            </label>
            <select
              id="items-per-page"
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {itemsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          aria-label="Previous page"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="hidden sm:inline ml-1">Previous</span>
        </button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  ...
                </span>
              )
            }

            const pageNum = page as number
            const isActive = pageNum === currentPage

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  isActive
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                aria-label={`Page ${pageNum}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        {/* Mobile page indicator */}
        <div className="sm:hidden px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
          Page {currentPage} of {totalPages}
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          aria-label="Next page"
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Jump to page */}
        {showJumpToPage && totalPages > 10 && (
          <form onSubmit={handleJumpToPage} className="hidden lg:flex items-center gap-2 ml-4">
            <label htmlFor="jump-to-page" className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Go to:
            </label>
            <input
              id="jump-to-page"
              type="number"
              min="1"
              max={totalPages}
              value={jumpToPageValue}
              onChange={(e) => setJumpToPageValue(e.target.value)}
              placeholder={currentPage.toString()}
              className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              aria-label="Jump to page number"
            />
            <button
              type="submit"
              className="px-2 py-1 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              Go
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
