'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Toaster } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { InventoryFilters } from '@/components/filters/InventoryFilters'
import { InventoryTable } from '@/components/tables/InventoryTable'
import { BulkActionsToolbar } from '@/components/tables/BulkActionsToolbar'
import { ExportButton } from '@/components/export/ExportButton'
import { useTablePreferences } from '@/hooks/useTablePreferences'
import { useDataLogManager } from '@/hooks/useDataLogManager'
import type { FilterState, InventoryItemWithUser } from '@/types'
import { toast } from '@/utils/toast'
import {
  EditInventoryModal,
  DeleteConfirmationDialog,
  AuditHistoryModal,
  BulkEditDestinationModal,
} from '@/components/modals'

export default function DataLogPage() {
  const t = useTranslations()
  const { data: session, status } = useSession()
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(true)
  
  // Table preferences hook
  const {
    preferences,
    setColumnWidth,
    toggleColumnVisibility,
    resetPreferences,
  } = useTablePreferences()
  
  // Data log manager hook
  const {
    items,
    total,
    aggregates,
    loading,
    error,
    page,
    pageSize,
    totalPages,
    filters,
    lastUpdated,
    fetchData,
    setFilters,
    setPage,
    setPageSize,
    refresh,
    reset,
  } = useDataLogManager({
    autoFetch: false, // We'll fetch after session is loaded
  })
  
  // State for table
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; name: string; email: string }>>([])
  
  // Modal states
  const [editingItem, setEditingItem] = useState<InventoryItemWithUser | null>(null)
  const [deletingItem, setDeletingItem] = useState<InventoryItemWithUser | null>(null)
  const [deletingItems, setDeletingItems] = useState<InventoryItemWithUser[]>([])
  const [viewingAuditItemId, setViewingAuditItemId] = useState<string | null>(null)
  const [viewingAuditItemName, setViewingAuditItemName] = useState<string | null>(null)
  const [bulkEditingItems, setBulkEditingItems] = useState<InventoryItemWithUser[]>([])
  
  // Fetch initial data when session is ready
  useEffect(() => {
    if (session?.user) {
      fetchData()
      fetchAvailableCategories()
      fetchAvailableUsers()
    }
  }, [session?.user])
  
  // Fetch available categories
  const fetchAvailableCategories = async () => {
    try {
      const response = await fetch('/api/inventory/data-log?pageSize=1000')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data?.items) {
          const categories = Array.from(
            new Set(
              result.data.items
                .map((item: InventoryItemWithUser) => item.category)
                .filter((cat: string | null) => cat !== null)
            )
          ) as string[]
          setAvailableCategories(categories.sort())
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }
  
  // Fetch available users (for ADMIN/SUPERVISOR)
  const fetchAvailableUsers = async () => {
    if (session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERVISOR') {
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data?.items) {
            setAvailableUsers(result.data.items.map((user: any) => ({
              id: user.id,
              name: user.name,
              email: user.email,
            })))
          }
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
      }
    }
  }
  
  // Calculate time since last update with auto-refresh
  const [, setTick] = useState(0)
  
  useEffect(() => {
    // Update the timestamp display every 10 seconds
    const interval = setInterval(() => {
      setTick(prev => prev + 1)
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])
  
  const timeSinceUpdate = useMemo(() => {
    if (!lastUpdated) return null
    
    const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }, [lastUpdated, setTick])

  // Calculate active filter count
  const activeFilterCount = [
    filters.search !== '',
    filters.startDate !== null || filters.endDate !== null,
    filters.destinations.length > 0,
    filters.categories.length > 0,
    filters.rejectFilter !== 'all',
    filters.enteredByIds.length > 0,
  ].filter(Boolean).length

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(newFilters)
  }, [setFilters])

  // Handle apply filters
  const handleApplyFilters = useCallback(async () => {
    try {
      await fetchData()
      toast.success('Filters applied successfully')
    } catch (error) {
      toast.error('Failed to apply filters')
    }
  }, [fetchData])

  // Handle sort
  const handleSort = useCallback((column: string) => {
    const newSortOrder = filters.sortBy === column && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    setFilters({
      sortBy: column,
      sortOrder: newSortOrder,
    })
  }, [filters.sortBy, filters.sortOrder, setFilters])

  // Handle row click
  const handleRowClick = useCallback((item: InventoryItemWithUser) => {
    setEditingItem(item)
  }, [])

  // Handle selection change
  const handleSelectionChange = useCallback((ids: Set<string>) => {
    setSelectedIds(ids)
  }, [])

  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Handle edit
  const handleEdit = useCallback((item: InventoryItemWithUser) => {
    setEditingItem(item)
  }, [])

  // Handle delete
  const handleDelete = useCallback((id: string) => {
    const item = items.find(i => i.id === id)
    if (item) {
      setDeletingItem(item)
    }
  }, [items])

  // Handle view audit
  const handleViewAudit = useCallback((id: string) => {
    const item = items.find(i => i.id === id)
    setViewingAuditItemId(id)
    setViewingAuditItemName(item?.itemName || null)
  }, [items])

  // Handle copy batch
  const handleCopyBatch = useCallback(async (batch: string) => {
    try {
      await navigator.clipboard.writeText(batch)
      toast.success('Batch number copied to clipboard')
    } catch (err) {
      console.error('Failed to copy batch number:', err)
      toast.error('Failed to copy batch number')
    }
  }, [])

  // Handle duplicate
  const handleDuplicate = useCallback(async (item: InventoryItemWithUser) => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemName: item.itemName,
          batch: `${item.batch}-COPY`,
          quantity: item.quantity,
          reject: item.reject,
          destination: item.destination,
          category: item.category,
          notes: item.notes ? `Copy of: ${item.notes}` : 'Duplicated entry',
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'Failed to duplicate item')
      }
      
      toast.success('Item duplicated successfully')
      await refresh()
    } catch (error) {
      console.error('Duplicate error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to duplicate item')
    }
  }, [refresh])

  // Handle bulk delete
  const handleBulkDelete = useCallback(() => {
    const itemsToDelete = items.filter(item => selectedIds.has(item.id))
    setDeletingItems(itemsToDelete)
  }, [selectedIds, items])

  // Handle bulk export
  const handleBulkExport = useCallback(() => {
    console.log('Bulk export:', Array.from(selectedIds))
    // This is handled by the ExportButton component
  }, [selectedIds])

  // Handle bulk edit destination
  const handleBulkEditDestination = useCallback(() => {
    const itemsToEdit = items.filter(item => selectedIds.has(item.id))
    setBulkEditingItems(itemsToEdit)
  }, [selectedIds, items])

  // Handle reset filters
  const handleResetFilters = useCallback(() => {
    reset()
    toast.success('Filters reset')
  }, [reset])
  
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      await refresh()
      toast.success('Data refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh data')
    }
  }, [refresh])
  
  // Handle export callback
  const handleExport = useCallback((format: 'csv' | 'json' | 'excel' | 'pdf', success: boolean, fileSize?: number) => {
    if (success) {
      const sizeText = fileSize ? ` (${fileSize.toFixed(2)} KB)` : ''
      toast.success(`${format.toUpperCase()} exported successfully${sizeText}`)
    } else {
      toast.error(`Failed to export ${format.toUpperCase()}`)
    }
  }, [])

  // Modal handlers
  const handleEditSuccess = useCallback(async () => {
    await refresh()
    setEditingItem(null)
  }, [refresh])

  const handleDeleteConfirm = useCallback(async () => {
    if (deletingItem) {
      // Single delete
      try {
        const response = await fetch(`/api/inventory/${deletingItem.id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error?.message || 'Failed to delete item')
        }

        toast.success('Item deleted successfully')
        await refresh()
        setDeletingItem(null)
      } catch (error) {
        console.error('Delete error:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to delete item')
        throw error
      }
    } else if (deletingItems.length > 0) {
      // Bulk delete
      try {
        const response = await fetch('/api/inventory/bulk-delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ids: deletingItems.map(item => item.id),
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error?.message || 'Failed to delete items')
        }

        const result = await response.json()
        toast.success(`${result.data?.deletedCount || deletingItems.length} items deleted successfully`)
        await refresh()
        setDeletingItems([])
        setSelectedIds(new Set())
      } catch (error) {
        console.error('Bulk delete error:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to delete items')
        throw error
      }
    }
  }, [deletingItem, deletingItems, refresh])

  const handleBulkEditSuccess = useCallback(async () => {
    await refresh()
    setBulkEditingItems([])
    setSelectedIds(new Set())
    toast.success('Destinations updated successfully')
  }, [refresh])

  // Authentication check and redirect
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toast notifications */}
      <Toaster position="top-right" />
      
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('dataLog.title')}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('dataLog.subtitle')}
              </p>
              {timeSinceUpdate && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Updated {timeSinceUpdate}
                  </p>
                </>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh data"
            >
              <svg
                className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {t('common.refresh')}
            </Button>
            
            <ExportButton
              data={items}
              filename="inventory-data-log"
              selectedIds={selectedIds}
              filters={filters}
              onExport={handleExport}
              disabled={loading || items.length === 0}
            />
          </div>
        </div>
        
        {/* Aggregates Summary */}
        {!loading && items.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Quantity</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                {aggregates.totalQuantity.toLocaleString()}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">Total Rejects</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
                {aggregates.totalRejects.toLocaleString()}
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Avg Reject Rate</p>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1">
                {aggregates.averageRejectRate.toFixed(2)}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Filter Sidebar */}
        <InventoryFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          activeFilterCount={activeFilterCount}
          isOpen={isFilterPanelOpen}
          onToggle={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
          userRole={session?.user?.role || 'DATA_ENTRY'}
          availableCategories={availableCategories}
          availableUsers={availableUsers}
          isLoading={loading}
        />

        {/* Table Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Toggle Filter Button (Mobile) */}
          {!isFilterPanelOpen && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                size="small"
                onClick={() => setIsFilterPanelOpen(true)}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                {t('dataLog.showFilters')}
              </Button>
            </div>
          )}

          {/* Bulk Actions Toolbar */}
          {selectedIds.size > 0 && (
            <BulkActionsToolbar
              selectedCount={selectedIds.size}
              onBulkDelete={handleBulkDelete}
              onBulkExport={handleBulkExport}
              onBulkEditDestination={handleBulkEditDestination}
              onClearSelection={handleClearSelection}
              userPermissions={session?.user?.permissions || []}
            />
          )}

          {/* Table Content */}
          <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <InventoryTable
                items={items}
                loading={loading}
                error={error}
                selectedIds={selectedIds}
                onSelectionChange={handleSelectionChange}
                onSort={handleSort}
                sortBy={filters.sortBy}
                sortOrder={filters.sortOrder}
                onRowClick={handleRowClick}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onViewAudit={handleViewAudit}
                onCopyBatch={handleCopyBatch}
                columnVisibility={preferences.columnVisibility}
                columnWidths={preferences.columnWidths}
                onColumnResize={setColumnWidth}
                onToggleColumnVisibility={toggleColumnVisibility}
                onResetPreferences={resetPreferences}
                userPermissions={session?.user?.permissions || []}
              />
              
              {/* Pagination */}
              {!loading && !error && items.length > 0 && (
                <div className="mt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} items
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Page size selector */}
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value={10}>10 per page</option>
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                      <option value={200}>200 per page</option>
                    </select>
                    
                    {/* Pagination buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1 px-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Page {page} of {totalPages}
                        </span>
                      </div>
                      
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <EditInventoryModal
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSuccess={handleEditSuccess}
      />

      <DeleteConfirmationDialog
        item={deletingItem}
        items={deletingItems}
        isOpen={!!deletingItem || deletingItems.length > 0}
        onClose={() => {
          setDeletingItem(null)
          setDeletingItems([])
        }}
        onConfirm={handleDeleteConfirm}
        isBulk={deletingItems.length > 0}
      />

      <AuditHistoryModal
        itemId={viewingAuditItemId}
        itemName={viewingAuditItemName || undefined}
        isOpen={!!viewingAuditItemId}
        onClose={() => {
          setViewingAuditItemId(null)
          setViewingAuditItemName(null)
        }}
      />

      <BulkEditDestinationModal
        items={bulkEditingItems}
        isOpen={bulkEditingItems.length > 0}
        onClose={() => setBulkEditingItems([])}
        onSuccess={handleBulkEditSuccess}
      />
    </div>
  )
}
