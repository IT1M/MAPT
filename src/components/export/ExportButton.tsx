'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'

export interface ExportButtonProps {
  data: any[]
  filename?: string
  selectedIds?: Set<string>
  filters?: Record<string, any>
  onExport?: (format: 'csv' | 'json' | 'excel' | 'pdf', success: boolean, fileSize?: number) => void
  className?: string
  disabled?: boolean
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename = 'inventory-export',
  selectedIds,
  filters,
  onExport,
  className = '',
  disabled = false,
}) => {
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportError, setExportError] = useState<string | null>(null)
  const [showPdfOptions, setShowPdfOptions] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get data to export (filtered or selected) - memoized for performance
  const exportData = useMemo(() => {
    if (selectedIds && selectedIds.size > 0) {
      return data.filter(item => selectedIds.has(item.id))
    }
    return data
  }, [data, selectedIds])

  const getExportData = () => exportData

  // Convert data to CSV with UTF-8 BOM for Excel compatibility
  const exportToCSV = async () => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      const exportData = getExportData()
      
      if (exportData.length === 0) {
        throw new Error('No data to export')
      }

      setExportProgress(25)

      // Get all unique keys from the data
      const headers = Array.from(
        new Set(exportData.flatMap(item => Object.keys(item)))
      )

      setExportProgress(50)

      // Create CSV content
      const csvRows = []
      
      // Add header row
      csvRows.push(headers.map(header => `"${header}"`).join(','))
      
      // Add data rows
      for (const item of exportData) {
        const values = headers.map(header => {
          const value = item[header]
          
          // Handle different data types
          if (value === null || value === undefined) {
            return '""'
          }
          
          if (typeof value === 'object') {
            // Handle nested objects (like user)
            if (value.name) return `"${value.name}"`
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`
          }
          
          // Escape quotes and wrap in quotes
          return `"${String(value).replace(/"/g, '""')}"`
        })
        
        csvRows.push(values.join(','))
      }

      setExportProgress(75)

      const csvContent = csvRows.join('\n')
      
      // Add UTF-8 BOM for Excel compatibility
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
      
      setExportProgress(90)

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setExportProgress(100)

      // Calculate file size
      const fileSize = blob.size / 1024
      
      // Show success message (you can replace with toast notification)
      console.log(`CSV exported successfully (${fileSize.toFixed(2)} KB)`)
      
      if (onExport) {
        onExport('csv', true, fileSize)
      }
    } catch (error) {
      console.error('CSV export failed:', error)
      setExportError(error instanceof Error ? error.message : 'Failed to export CSV')
      if (onExport) {
        onExport('csv', false)
      }
    } finally {
      setIsExporting(false)
      setExportProgress(0)
      setIsOpen(false)
    }
  }

  // Export to JSON with metadata
  const exportToJSON = async () => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      const exportData = getExportData()
      
      if (exportData.length === 0) {
        throw new Error('No data to export')
      }

      setExportProgress(25)

      // Create JSON with metadata
      const jsonData = {
        metadata: {
          exportDate: new Date().toISOString(),
          totalRecords: exportData.length,
          filters: filters || {},
          selectedOnly: selectedIds && selectedIds.size > 0,
        },
        data: exportData,
      }

      setExportProgress(75)

      const jsonString = JSON.stringify(jsonData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      
      setExportProgress(90)

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setExportProgress(100)

      // Calculate file size
      const fileSize = blob.size / 1024
      
      // Show success message (you can replace with toast notification)
      console.log(`JSON exported successfully (${fileSize.toFixed(2)} KB)`)
      
      if (onExport) {
        onExport('json', true, fileSize)
      }
    } catch (error) {
      console.error('JSON export failed:', error)
      setExportError(error instanceof Error ? error.message : 'Failed to export JSON')
      if (onExport) {
        onExport('json', false)
      }
    } finally {
      setIsExporting(false)
      setExportProgress(0)
      setIsOpen(false)
    }
  }

  // Export to Excel (server-side)
  const exportToExcel = async () => {
    setIsExporting(true)
    setExportProgress(0)
    setExportError(null)

    try {
      const exportData = getExportData()
      
      if (exportData.length === 0) {
        throw new Error('No data to export')
      }

      setExportProgress(10)

      // Prepare request payload
      const payload = {
        filters: filters || {},
        ids: selectedIds && selectedIds.size > 0 ? Array.from(selectedIds) : undefined,
      }

      setExportProgress(25)

      // Call API endpoint
      const response = await fetch('/api/inventory/export/excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      setExportProgress(50)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `Export failed with status ${response.status}`)
      }

      // Get the blob from response
      const blob = await response.blob()
      
      setExportProgress(75)

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let fileName = `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/)
        if (fileNameMatch) {
          fileName = fileNameMatch[1]
        }
      }

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setExportProgress(100)

      // Calculate file size
      const fileSize = blob.size / 1024
      
      // Show success message
      console.log(`Excel exported successfully (${fileSize.toFixed(2)} KB)`)
      
      if (onExport) {
        onExport('excel', true, fileSize)
      }
    } catch (error) {
      console.error('Excel export failed:', error)
      setExportError(error instanceof Error ? error.message : 'Failed to export Excel')
      if (onExport) {
        onExport('excel', false)
      }
    } finally {
      setIsExporting(false)
      setExportProgress(0)
      setIsOpen(false)
    }
  }

  // Export to PDF (server-side)
  const exportToPDF = async (orientation: 'portrait' | 'landscape' = 'landscape') => {
    setIsExporting(true)
    setExportProgress(0)
    setExportError(null)

    try {
      const exportData = getExportData()
      
      if (exportData.length === 0) {
        throw new Error('No data to export')
      }

      setExportProgress(10)

      // Prepare request payload
      const payload = {
        filters: filters || {},
        ids: selectedIds && selectedIds.size > 0 ? Array.from(selectedIds) : undefined,
        options: {
          orientation,
          includeHeader: true,
          includeLogo: true,
        },
      }

      setExportProgress(25)

      // Call API endpoint
      const response = await fetch('/api/inventory/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      setExportProgress(50)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `Export failed with status ${response.status}`)
      }

      // Get the blob from response
      const blob = await response.blob()
      
      setExportProgress(75)

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let fileName = `${filename}-${new Date().toISOString().split('T')[0]}.pdf`
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/)
        if (fileNameMatch) {
          fileName = fileNameMatch[1]
        }
      }

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setExportProgress(100)

      // Calculate file size
      const fileSize = blob.size / 1024
      
      // Show success message
      console.log(`PDF exported successfully (${fileSize.toFixed(2)} KB)`)
      
      if (onExport) {
        onExport('pdf', true, fileSize)
      }
    } catch (error) {
      console.error('PDF export failed:', error)
      setExportError(error instanceof Error ? error.message : 'Failed to export PDF')
      if (onExport) {
        onExport('pdf', false)
      }
    } finally {
      setIsExporting(false)
      setExportProgress(0)
      setIsOpen(false)
      setShowPdfOptions(false)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowPdfOptions(false)
        setExportError(null)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const exportDataCount = exportData.length

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting || data.length === 0}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors touch-manipulation"
        aria-label={t('common.export')}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {isExporting ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
            <span>{t('dataLog.exporting')} {exportProgress}%</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>{t('common.export')}</span>
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && !isExporting && (
        <div
          className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('dataLog.exportFormat')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('dataLog.itemsWillBeExported', { count: exportDataCount })}
            </p>
          </div>

          <div className="py-1">
            {/* CSV Export */}
            <button
              onClick={exportToCSV}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation"
              role="menuitem"
            >
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('dataLog.csvExcel')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('dataLog.csvDescription')}
                  </div>
                </div>
              </div>
            </button>

            {/* JSON Export */}
            <button
              onClick={exportToJSON}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation"
              role="menuitem"
            >
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('dataLog.jsonFormat')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('dataLog.jsonDescription')}
                  </div>
                </div>
              </div>
            </button>

            {/* Excel Export */}
            <button
              onClick={exportToExcel}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation"
              role="menuitem"
            >
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('dataLog.excelFormat')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('dataLog.excelDescription')}
                  </div>
                </div>
              </div>
            </button>

            {/* PDF Export */}
            {!showPdfOptions ? (
              <button
                onClick={() => setShowPdfOptions(true)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation"
                role="menuitem"
              >
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t('dataLog.pdfFormat')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {t('dataLog.pdfDescription')}
                    </div>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ) : (
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {t('dataLog.pdfOrientation')}
                  </span>
                  <button
                    onClick={() => setShowPdfOptions(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 touch-manipulation"
                    aria-label={t('common.back')}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => exportToPDF('landscape')}
                    className="w-full text-left px-3 py-2 text-sm bg-white dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600 touch-manipulation"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-gray-600 dark:text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 5h16M4 12h16M4 19h16"
                        />
                      </svg>
                      <span className="text-gray-900 dark:text-gray-100">{t('dataLog.landscape')}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">({t('dataLog.recommended')})</span>
                    </div>
                  </button>
                  <button
                    onClick={() => exportToPDF('portrait')}
                    className="w-full text-left px-3 py-2 text-sm bg-white dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600 touch-manipulation"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-gray-600 dark:text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      <span className="text-gray-900 dark:text-gray-100">{t('dataLog.portrait')}</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {exportError && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20" role="alert">
              <div className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-xs font-medium text-red-700 dark:text-red-300">
                    {t('dataLog.exportError')}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                    {exportError}
                  </p>
                </div>
                <button
                  onClick={() => setExportError(null)}
                  className="text-red-400 hover:text-red-600 dark:hover:text-red-200 touch-manipulation"
                  aria-label={t('common.close')}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {selectedIds && selectedIds.size > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20" role="status">
              <div className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {t('dataLog.selectedItemsOnly')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
