'use client'

import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import type { InventoryItemWithUser } from '@/types'
import { Destination } from '@prisma/client'
import { VirtualizedTable } from './VirtualizedTable'

interface InventoryTableProps {
  items: InventoryItemWithUser[]
  loading?: boolean
  error?: Error | null
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  onSort?: (column: string) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onRowClick?: (item: InventoryItemWithUser) => void
  onEdit?: (item: InventoryItemWithUser) => void
  onDelete?: (id: string) => void
  onDuplicate?: (item: InventoryItemWithUser) => void
  onViewAudit?: (id: string) => void
  onCopyBatch?: (batch: string) => void
  columnVisibility?: Record<string, boolean>
  columnWidths?: Record<string, number>
  onColumnResize?: (column: string, width: number) => void
  onToggleColumnVisibility?: (column: string) => void
  onResetPreferences?: () => void
  userPermissions?: string[]
}

interface ColumnConfig {
  id: string
  label: string
  sortable: boolean
  sticky: boolean
  align: 'left' | 'center' | 'right'
  minWidth: number
  defaultWidth: number
  hiddenOnMobile: boolean
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  loading = false,
  error = null,
  selectedIds = new Set(),
  onSelectionChange,
  onSort,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  onRowClick,
  onEdit,
  onDelete,
  onDuplicate,
  onViewAudit,
  onCopyBatch,
  columnVisibility = {},
  columnWidths = {},
  onColumnResize,
  onToggleColumnVisibility,
  onResetPreferences,
  userPermissions = [],
}) => {
  const t = useTranslations()
  
  // State for column resizing
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState<number>(0)
  const [resizeStartWidth, setResizeStartWidth] = useState<number>(0)
  const [showColumnMenu, setShowColumnMenu] = useState<boolean>(false)
  const columnMenuRef = useRef<HTMLDivElement>(null)
  
  // State for actions dropdown and context menu
  const [openActionsDropdown, setOpenActionsDropdown] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: InventoryItemWithUser } | null>(null)
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1)
  const actionsDropdownRef = useRef<HTMLDivElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const tableBodyRef = useRef<HTMLTableSectionElement>(null)

  // Column configuration
  const columns: ColumnConfig[] = useMemo(() => [
    {
      id: 'itemName',
      label: 'Item Name',
      sortable: true,
      sticky: true,
      align: 'left',
      minWidth: 150,
      defaultWidth: 200,
      hiddenOnMobile: false,
    },
    {
      id: 'batch',
      label: 'Batch Number',
      sortable: true,
      sticky: false,
      align: 'left',
      minWidth: 120,
      defaultWidth: 150,
      hiddenOnMobile: false,
    },
    {
      id: 'quantity',
      label: 'Quantity',
      sortable: true,
      sticky: false,
      align: 'right',
      minWidth: 80,
      defaultWidth: 100,
      hiddenOnMobile: false,
    },
    {
      id: 'reject',
      label: 'Reject',
      sortable: true,
      sticky: false,
      align: 'right',
      minWidth: 80,
      defaultWidth: 100,
      hiddenOnMobile: true,
    },
    {
      id: 'rejectPercentage',
      label: 'Reject %',
      sortable: true,
      sticky: false,
      align: 'right',
      minWidth: 90,
      defaultWidth: 110,
      hiddenOnMobile: true,
    },
    {
      id: 'destination',
      label: 'Destination',
      sortable: true,
      sticky: false,
      align: 'left',
      minWidth: 100,
      defaultWidth: 120,
      hiddenOnMobile: false,
    },
    {
      id: 'category',
      label: 'Category',
      sortable: true,
      sticky: false,
      align: 'left',
      minWidth: 120,
      defaultWidth: 150,
      hiddenOnMobile: true,
    },
    {
      id: 'enteredBy',
      label: 'Entered By',
      sortable: true,
      sticky: false,
      align: 'left',
      minWidth: 120,
      defaultWidth: 150,
      hiddenOnMobile: true,
    },
    {
      id: 'createdAt',
      label: 'Date Added',
      sortable: true,
      sticky: false,
      align: 'left',
      minWidth: 140,
      defaultWidth: 180,
      hiddenOnMobile: true,
    },
    {
      id: 'actions',
      label: 'Actions',
      sortable: false,
      sticky: false,
      align: 'center',
      minWidth: 80,
      defaultWidth: 100,
      hiddenOnMobile: false,
    },
  ], [])

  // Calculate reject percentage
  const calculateRejectPercentage = (item: InventoryItemWithUser): number => {
    if (item.quantity === 0) return 0
    return (item.reject / item.quantity) * 100
  }

  // Get reject percentage color
  const getRejectPercentageColor = (percentage: number): string => {
    if (percentage === 0) return 'text-green-600 dark:text-green-400'
    if (percentage <= 5) return 'text-yellow-600 dark:text-yellow-400'
    if (percentage <= 10) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400 font-semibold'
  }

  // Get destination badge color
  const getDestinationBadgeColor = (destination: Destination): string => {
    switch (destination) {
      case Destination.MAIS:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case Destination.FOZAN:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  // Format date as "DD MMM YYYY, HH:mm"
  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    const day = d.getDate().toString().padStart(2, '0')
    const month = d.toLocaleString('en', { month: 'short' })
    const year = d.getFullYear()
    const hours = d.getHours().toString().padStart(2, '0')
    const minutes = d.getMinutes().toString().padStart(2, '0')
    return `${day} ${month} ${year}, ${hours}:${minutes}`
  }

  // Check if user can delete
  const canDelete = useMemo(() => {
    return userPermissions.includes('inventory:delete')
  }, [userPermissions])

  // Handle copy batch number to clipboard
  const handleCopyBatch = useCallback(async (batch: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    try {
      await navigator.clipboard.writeText(batch)
      // You can add a toast notification here
      console.log('Batch number copied to clipboard')
    } catch (err) {
      console.error('Failed to copy batch number:', err)
    }
    setOpenActionsDropdown(null)
    setContextMenu(null)
  }, [])

  // Handle action clicks
  const handleEdit = useCallback((item: InventoryItemWithUser, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    if (onEdit) {
      onEdit(item)
    }
    setOpenActionsDropdown(null)
    setContextMenu(null)
  }, [onEdit])

  const handleDuplicate = useCallback((item: InventoryItemWithUser, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    if (onDuplicate) {
      onDuplicate(item)
    }
    setOpenActionsDropdown(null)
    setContextMenu(null)
  }, [onDuplicate])

  const handleDelete = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    if (onDelete) {
      onDelete(id)
    }
    setOpenActionsDropdown(null)
    setContextMenu(null)
  }, [onDelete])

  const handleViewAudit = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    if (onViewAudit) {
      onViewAudit(id)
    }
    setOpenActionsDropdown(null)
    setContextMenu(null)
  }, [onViewAudit])

  // Handle right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent, item: InventoryItemWithUser) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item
    })
    setOpenActionsDropdown(null)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number, item: InventoryItemWithUser) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (index < items.length - 1) {
          setFocusedRowIndex(index + 1)
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (index > 0) {
          setFocusedRowIndex(index - 1)
        }
        break
      case 'Enter':
        e.preventDefault()
        if (onRowClick) {
          onRowClick(item)
        }
        break
      case 'Space':
        e.preventDefault()
        if (onSelectionChange) {
          const newSelection = new Set(selectedIds)
          if (selectedIds.has(item.id)) {
            newSelection.delete(item.id)
          } else {
            newSelection.add(item.id)
          }
          onSelectionChange(newSelection)
        }
        break
      case 'Escape':
        setOpenActionsDropdown(null)
        setContextMenu(null)
        break
    }
  }, [items, onRowClick, onSelectionChange, selectedIds])

  // Focus row when focusedRowIndex changes
  useEffect(() => {
    if (focusedRowIndex >= 0 && tableBodyRef.current) {
      const rows = tableBodyRef.current.querySelectorAll('tr')
      const row = rows[focusedRowIndex] as HTMLElement
      if (row) {
        row.focus()
      }
    }
  }, [focusedRowIndex])

  // Handle sort
  const handleSort = (columnId: string) => {
    if (onSort) {
      onSort(columnId)
    }
  }

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        const allIds = new Set(items.map(item => item.id))
        onSelectionChange(allIds)
      } else {
        onSelectionChange(new Set())
      }
    }
  }

  // Handle individual selection
  const handleSelectItem = (id: string, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = new Set(selectedIds)
      if (checked) {
        newSelection.add(id)
      } else {
        newSelection.delete(id)
      }
      onSelectionChange(newSelection)
    }
  }

  // Check if column is visible
  const isColumnVisible = (columnId: string): boolean => {
    return columnVisibility[columnId] !== false
  }

  // Get column width
  const getColumnWidth = (column: ColumnConfig): number => {
    return columnWidths[column.id] || column.defaultWidth
  }

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, columnId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const column = columns.find(c => c.id === columnId)
    if (!column) return
    
    setResizingColumn(columnId)
    setResizeStartX(e.clientX)
    setResizeStartWidth(getColumnWidth(column))
  }, [columns, columnWidths])

  // Handle resize move
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingColumn) return
    
    const column = columns.find(c => c.id === resizingColumn)
    if (!column) return
    
    const diff = e.clientX - resizeStartX
    const newWidth = Math.max(column.minWidth, resizeStartWidth + diff)
    
    if (onColumnResize) {
      onColumnResize(resizingColumn, newWidth)
    }
  }, [resizingColumn, resizeStartX, resizeStartWidth, columns, onColumnResize])

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null)
  }, [])

  // Add/remove resize event listeners
  React.useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove)
        document.removeEventListener('mouseup', handleResizeEnd)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [resizingColumn, handleResizeMove, handleResizeEnd])

  // Close column menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
        setShowColumnMenu(false)
      }
    }
    
    if (showColumnMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColumnMenu])

  // Close actions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(e.target as Node)) {
        setOpenActionsDropdown(null)
      }
    }
    
    if (openActionsDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openActionsDropdown])

  // Close context menu when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    
    const handleScroll = () => {
      setContextMenu(null)
    }
    
    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('scroll', handleScroll, true)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        window.removeEventListener('scroll', handleScroll, true)
      }
    }
  }, [contextMenu])

  // Render row for virtual scrolling (defined before any early returns)
  const renderVirtualRow = useCallback(({
    item,
    index,
    style,
    isSelected,
    onSelect,
    onRowClick: handleRowClickVirtual,
    onEdit: handleEditVirtual,
    onDelete: handleDeleteVirtual,
    onDuplicate: handleDuplicateVirtual,
    onViewAudit: handleViewAuditVirtual,
    onCopyBatch: handleCopyBatchVirtual,
  }: {
    item: InventoryItemWithUser
    index: number
    style: React.CSSProperties
    isSelected: boolean
    onSelect: (checked: boolean) => void
    onRowClick: () => void
    onEdit: () => void
    onDelete: () => void
    onDuplicate: () => void
    onViewAudit: () => void
    onCopyBatch: () => void
  }) => {
    const rejectPercentage = calculateRejectPercentage(item)

    return (
      <div
        style={style}
        className={`flex items-center border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
          isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-white dark:bg-gray-900'
        }`}
        onClick={handleRowClickVirtual}
        role="row"
        aria-selected={isSelected}
      >
        {/* Selection checkbox */}
        {onSelectionChange && (
          <div className="px-3 py-4 w-12 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
              aria-label={`Select ${item.itemName}`}
            />
          </div>
        )}

        {/* Item Name */}
        {isColumnVisible('itemName') && (
          <div className="px-3 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 flex-shrink-0" style={{ width: getColumnWidth(columns.find(c => c.id === 'itemName')!) }}>
            {item.itemName}
          </div>
        )}

        {/* Batch Number */}
        {isColumnVisible('batch') && (
          <div className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300 flex-shrink-0" style={{ width: getColumnWidth(columns.find(c => c.id === 'batch')!) }}>
            <span className="font-mono">{item.batch}</span>
          </div>
        )}

        {/* Quantity */}
        {isColumnVisible('quantity') && (
          <div className="px-3 py-4 text-sm text-right text-gray-900 dark:text-gray-100 font-medium flex-shrink-0" style={{ width: getColumnWidth(columns.find(c => c.id === 'quantity')!) }}>
            {item.quantity.toLocaleString()}
          </div>
        )}

        {/* Reject */}
        {isColumnVisible('reject') && (
          <div className="px-3 py-4 text-sm text-right text-gray-700 dark:text-gray-300 hidden md:flex flex-shrink-0" style={{ width: getColumnWidth(columns.find(c => c.id === 'reject')!) }}>
            {item.reject.toLocaleString()}
          </div>
        )}

        {/* Reject Percentage */}
        {isColumnVisible('rejectPercentage') && (
          <div className={`px-3 py-4 text-sm text-right font-medium hidden md:flex flex-shrink-0 ${getRejectPercentageColor(rejectPercentage)}`} style={{ width: getColumnWidth(columns.find(c => c.id === 'rejectPercentage')!) }}>
            {rejectPercentage.toFixed(2)}%
          </div>
        )}

        {/* Destination */}
        {isColumnVisible('destination') && (
          <div className="px-3 py-4 text-sm flex-shrink-0" style={{ width: getColumnWidth(columns.find(c => c.id === 'destination')!) }}>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDestinationBadgeColor(item.destination)}`}>
              {item.destination}
            </span>
          </div>
        )}

        {/* Category */}
        {isColumnVisible('category') && (
          <div className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300 hidden md:flex flex-shrink-0" style={{ width: getColumnWidth(columns.find(c => c.id === 'category')!) }}>
            {item.category || '-'}
          </div>
        )}

        {/* Entered By */}
        {isColumnVisible('enteredBy') && (
          <div className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300 hidden md:flex flex-shrink-0" style={{ width: getColumnWidth(columns.find(c => c.id === 'enteredBy')!) }}>
            {item.enteredBy?.name || '-'}
          </div>
        )}

        {/* Date Added */}
        {isColumnVisible('createdAt') && (
          <div className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300 hidden md:flex flex-shrink-0" style={{ width: getColumnWidth(columns.find(c => c.id === 'createdAt')!) }}>
            {formatDate(item.createdAt)}
          </div>
        )}

        {/* Actions */}
        {isColumnVisible('actions') && (
          <div className="px-3 py-4 text-sm text-center flex-shrink-0" style={{ width: getColumnWidth(columns.find(c => c.id === 'actions')!) }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleEditVirtual()
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Edit item"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    )
  }, [columns, columnVisibility, columnWidths, onSelectionChange, calculateRejectPercentage, getRejectPercentageColor, getDestinationBadgeColor, formatDate, isColumnVisible, getColumnWidth])

  // Loading skeleton
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {columns.filter(col => isColumnVisible(col.id)).map(col => (
                    <th
                      key={col.id}
                      className={`px-3 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-100 ${
                        col.hiddenOnMobile ? 'hidden md:table-cell' : ''
                      }`}
                    >
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {[...Array(5)].map((_, idx) => (
                  <tr key={idx}>
                    {columns.filter(col => isColumnVisible(col.id)).map(col => (
                      <td
                        key={col.id}
                        className={`px-3 py-4 ${
                          col.hiddenOnMobile ? 'hidden md:table-cell' : ''
                        }`}
                      >
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Failed to load data
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {error.message}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {t('common.retry')}
        </button>
      </div>
    )
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {t('dataLog.noData')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No inventory entries found. Try adjusting your filters.
        </p>
      </div>
    )
  }

  // Use virtual scrolling for large datasets (>1000 rows)
  const useVirtualScrolling = items.length > 1000

  // If using virtual scrolling, render VirtualizedTable
  if (useVirtualScrolling) {
    return (
      <div className="space-y-2">
        {/* Column customization toolbar */}
        <div className="flex justify-between items-center gap-2 px-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Using virtual scrolling for {items.length.toLocaleString()} items
          </div>
          <div className="relative" ref={columnMenuRef}>
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              aria-label="Column settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Columns
            </button>
            
            {/* Column menu dropdown */}
            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Show/Hide Columns
                  </h3>
                </div>
                <div className="p-2 max-h-96 overflow-y-auto">
                  {columns.map(col => (
                    <label
                      key={col.id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isColumnVisible(col.id)}
                        onChange={() => onToggleColumnVisibility && onToggleColumnVisibility(col.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {col.label}
                      </span>
                    </label>
                  ))}
                </div>
                {onResetPreferences && (
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        onResetPreferences()
                        setShowColumnMenu(false)
                      }}
                      className="w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Reset to Default
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Virtual scrolling table */}
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <VirtualizedTable
            items={items}
            rowHeight={60}
            selectedIds={selectedIds}
            onSelectionChange={onSelectionChange}
            onRowClick={onRowClick}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onViewAudit={onViewAudit}
            onCopyBatch={onCopyBatch}
            columnVisibility={columnVisibility}
            userPermissions={userPermissions}
            renderRow={renderVirtualRow}
          />
        </div>
      </div>
    )
  }

  // Main table (for datasets <= 1000 rows)
  return (
    <div className="space-y-2">
      {/* Column customization toolbar */}
      <div className="flex justify-end items-center gap-2 px-2">
        <div className="relative" ref={columnMenuRef}>
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            aria-label="Column settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Columns
          </button>
          
          {/* Column menu dropdown */}
          {showColumnMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Show/Hide Columns
                </h3>
              </div>
              <div className="p-2 max-h-96 overflow-y-auto">
                {columns.map(col => (
                  <label
                    key={col.id}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isColumnVisible(col.id)}
                      onChange={() => onToggleColumnVisibility && onToggleColumnVisibility(col.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {col.label}
                    </span>
                  </label>
                ))}
              </div>
              {onResetPreferences && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      onResetPreferences()
                      setShowColumnMenu(false)
                    }}
                    className="w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Reset to Default
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              {/* Table Header */}
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  {/* Selection checkbox */}
                  {onSelectionChange && (
                    <th className="px-3 py-3.5 w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === items.length && items.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        aria-label="Select all items"
                      />
                    </th>
                  )}

                  {/* Column headers */}
                  {columns.filter(col => isColumnVisible(col.id)).map(col => (
                    <th
                      key={col.id}
                      className={`relative px-3 py-3.5 text-${col.align} text-sm font-semibold text-gray-900 dark:text-gray-100 ${
                        col.sticky ? 'sticky left-0 bg-gray-50 dark:bg-gray-800 z-10' : ''
                      } ${
                        col.hiddenOnMobile ? 'hidden md:table-cell' : ''
                      } ${
                        col.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none' : ''
                      }`}
                      style={{ minWidth: col.minWidth, width: getColumnWidth(col) }}
                      onClick={() => col.sortable && handleSort(col.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span>{col.label}</span>
                        {col.sortable && sortBy === col.id && (
                          <svg
                            className={`w-4 h-4 transition-transform ${
                              sortOrder === 'desc' ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        )}
                      </div>
                      
                      {/* Resize handle */}
                      {onColumnResize && (
                        <div
                          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary-500 group"
                          onMouseDown={(e) => handleResizeStart(e, col.id)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="absolute top-0 right-0 w-1 h-full bg-transparent group-hover:bg-primary-500 transition-colors" />
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

            {/* Table Body */}
            <tbody ref={tableBodyRef} className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {items.map((item, index) => {
                const rejectPercentage = calculateRejectPercentage(item)
                const isSelected = selectedIds.has(item.id)
                const isFocused = focusedRowIndex === index

                return (
                  <tr
                    key={item.id}
                    tabIndex={0}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                    } ${
                      isFocused ? 'ring-2 ring-primary-500 ring-inset' : ''
                    } ${
                      onRowClick ? 'cursor-pointer' : ''
                    } focus:outline-none`}
                    onClick={() => onRowClick && onRowClick(item)}
                    onContextMenu={(e) => handleContextMenu(e, item)}
                    onKeyDown={(e) => handleKeyDown(e, index, item)}
                    onFocus={() => setFocusedRowIndex(index)}
                    role="row"
                    aria-selected={isSelected}
                  >
                    {/* Selection checkbox */}
                    {onSelectionChange && (
                      <td className="px-3 py-4 w-12" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                          aria-label={`Select ${item.itemName}`}
                        />
                      </td>
                    )}

                    {/* Item Name - Sticky */}
                    {isColumnVisible('itemName') && (
                      <td
                        className="px-3 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 sticky left-0 bg-white dark:bg-gray-900 z-10"
                        style={{ minWidth: columns.find(c => c.id === 'itemName')?.minWidth }}
                      >
                        {item.itemName}
                      </td>
                    )}

                    {/* Batch Number */}
                    {isColumnVisible('batch') && (
                      <td className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-mono">{item.batch}</span>
                      </td>
                    )}

                    {/* Quantity - Right aligned */}
                    {isColumnVisible('quantity') && (
                      <td className="px-3 py-4 text-sm text-right text-gray-900 dark:text-gray-100 font-medium">
                        {item.quantity.toLocaleString()}
                      </td>
                    )}

                    {/* Reject - Right aligned */}
                    {isColumnVisible('reject') && (
                      <td className="px-3 py-4 text-sm text-right text-gray-700 dark:text-gray-300 hidden md:table-cell">
                        {item.reject.toLocaleString()}
                      </td>
                    )}

                    {/* Reject Percentage - Right aligned with color coding */}
                    {isColumnVisible('rejectPercentage') && (
                      <td className={`px-3 py-4 text-sm text-right font-medium hidden md:table-cell ${getRejectPercentageColor(rejectPercentage)}`}>
                        {rejectPercentage.toFixed(2)}%
                      </td>
                    )}

                    {/* Destination - Color-coded badge */}
                    {isColumnVisible('destination') && (
                      <td className="px-3 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDestinationBadgeColor(item.destination)}`}>
                          {item.destination}
                        </span>
                      </td>
                    )}

                    {/* Category */}
                    {isColumnVisible('category') && (
                      <td className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300 hidden md:table-cell">
                        {item.category || '-'}
                      </td>
                    )}

                    {/* Entered By */}
                    {isColumnVisible('enteredBy') && (
                      <td className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300 hidden md:table-cell">
                        {item.enteredBy?.name || '-'}
                      </td>
                    )}

                    {/* Date Added - Formatted */}
                    {isColumnVisible('createdAt') && (
                      <td className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300 hidden md:table-cell">
                        {formatDate(item.createdAt)}
                      </td>
                    )}

                    {/* Actions */}
                    {isColumnVisible('actions') && (
                      <td className="px-3 py-4 text-sm text-center relative" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenActionsDropdown(openActionsDropdown === item.id ? null : item.id)
                              setContextMenu(null)
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Actions menu"
                            aria-expanded={openActionsDropdown === item.id}
                            aria-haspopup="true"
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
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                          </button>

                          {/* Actions Dropdown */}
                          {openActionsDropdown === item.id && (
                            <div
                              ref={actionsDropdownRef}
                              className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
                              role="menu"
                              aria-orientation="vertical"
                            >
                              <div className="py-1">
                                {/* Edit */}
                                {onEdit && (
                                  <button
                                    onClick={(e) => handleEdit(item, e)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                                    role="menuitem"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                  </button>
                                )}

                                {/* Duplicate */}
                                {onDuplicate && (
                                  <button
                                    onClick={(e) => handleDuplicate(item, e)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                                    role="menuitem"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Duplicate
                                  </button>
                                )}

                                {/* View Audit History */}
                                {onViewAudit && (
                                  <button
                                    onClick={(e) => handleViewAudit(item.id, e)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                                    role="menuitem"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    View Audit History
                                  </button>
                                )}

                                {/* Copy Batch Number */}
                                {onCopyBatch && (
                                  <button
                                    onClick={(e) => handleCopyBatch(item.batch, e)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                                    role="menuitem"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                    </svg>
                                    Copy Batch Number
                                  </button>
                                )}

                                {/* Delete - Only for SUPERVISOR/ADMIN */}
                                {onDelete && canDelete && (
                                  <>
                                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                    <button
                                      onClick={(e) => handleDelete(item.id, e)}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
                                      role="menuitem"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 min-w-[200px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          role="menu"
          aria-orientation="vertical"
        >
          {/* Edit */}
          {onEdit && (
            <button
              onClick={(e) => handleEdit(contextMenu.item, e)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              role="menuitem"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}

          {/* Duplicate */}
          {onDuplicate && (
            <button
              onClick={(e) => handleDuplicate(contextMenu.item, e)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              role="menuitem"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Duplicate
            </button>
          )}

          {/* View Audit History */}
          {onViewAudit && (
            <button
              onClick={(e) => handleViewAudit(contextMenu.item.id, e)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              role="menuitem"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View Audit History
            </button>
          )}

          {/* Copy Batch Number */}
          {onCopyBatch && (
            <button
              onClick={(e) => handleCopyBatch(contextMenu.item.batch, e)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              role="menuitem"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy Batch Number
            </button>
          )}

          {/* Delete - Only for SUPERVISOR/ADMIN */}
          {onDelete && canDelete && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
              <button
                onClick={(e) => handleDelete(contextMenu.item.id, e)}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
                role="menuitem"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
    </div>
  )
}
