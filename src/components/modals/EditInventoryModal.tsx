'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { Modal } from '@/components/ui/modal'
import { InventoryForm } from '@/components/forms/inventory-form'
import type { InventoryItemWithUser, AuditHistoryEntry } from '@/types'

interface EditInventoryModalProps {
  item: InventoryItemWithUser | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditInventoryModal({
  item,
  isOpen,
  onClose,
  onSuccess,
}: EditInventoryModalProps) {
  const t = useTranslations()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
  const [changeHistory, setChangeHistory] = useState<AuditHistoryEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Fetch change history when modal opens
  useEffect(() => {
    if (isOpen && item) {
      fetchChangeHistory()
    } else {
      setChangeHistory([])
      setHasUnsavedChanges(false)
    }
  }, [isOpen, item])

  const fetchChangeHistory = async () => {
    if (!item) return
    
    setLoadingHistory(true)
    try {
      const response = await fetch(`/api/inventory/${item.id}/audit-history?pageSize=5`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data?.entries) {
          setChangeHistory(result.data.entries)
        }
      }
    } catch (error) {
      console.error('Failed to fetch change history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowCloseConfirmation(true)
    } else {
      onClose()
    }
  }

  const handleConfirmClose = () => {
    setShowCloseConfirmation(false)
    setHasUnsavedChanges(false)
    onClose()
  }

  const handleCancelClose = () => {
    setShowCloseConfirmation(false)
  }

  const handleFormSuccess = () => {
    setHasUnsavedChanges(false)
    onSuccess()
    onClose()
  }

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    const day = d.getDate().toString().padStart(2, '0')
    const month = d.toLocaleString('en', { month: 'short' })
    const year = d.getFullYear()
    const hours = d.getHours().toString().padStart(2, '0')
    const minutes = d.getMinutes().toString().padStart(2, '0')
    return `${day} ${month} ${year}, ${hours}:${minutes}`
  }

  const getActionLabel = (action: string): string => {
    switch (action) {
      case 'CREATE':
        return 'Created'
      case 'UPDATE':
        return 'Updated'
      case 'DELETE':
        return 'Deleted'
      default:
        return action
    }
  }

  if (!item) return null

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={t('dataLog.editItem')}
        size="large"
      >
        <div className="space-y-6">
          {/* Form */}
          <div>
            <InventoryForm
              item={item}
              onSuccess={handleFormSuccess}
              onCancel={handleClose}
            />
          </div>

          {/* Change History */}
          {changeHistory.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t('dataLog.recentChanges')}
              </h3>
              
              {loadingHistory ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, idx) => (
                    <div key={idx} className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {changeHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {getActionLabel(entry.action)}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {entry.user.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(entry.timestamp)}
                        </span>
                      </div>
                      
                      {entry.changes && entry.changes.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {entry.changes.map((change, idx) => (
                            <div
                              key={idx}
                              className="text-sm text-gray-600 dark:text-gray-400"
                            >
                              <span className="font-medium">{change.field}:</span>{' '}
                              <span className="line-through text-red-600 dark:text-red-400">
                                {String(change.oldValue)}
                              </span>
                              {' → '}
                              <span className="text-green-600 dark:text-green-400">
                                {String(change.newValue)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Unsaved Changes Confirmation Dialog */}
      {showCloseConfirmation && (
        <Modal
          isOpen={showCloseConfirmation}
          onClose={handleCancelClose}
          title={t('common.unsavedChanges')}
          size="small"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('common.unsavedChangesMessage')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirmClose}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {t('common.discardChanges')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
