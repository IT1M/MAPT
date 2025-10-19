'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { AuditLog, User, UserRole } from '@prisma/client'
import { DEFAULT_PAGE_SIZE } from '@/utils/constants'
import toast from 'react-hot-toast'

type AuditLogWithUser = AuditLog & {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
  }
}

export default function AuditPage() {
  const t = useTranslations()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLogWithUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalPages, setTotalPages] = useState(0)
  
  // Filters
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  
  // Modal state for viewing changes
  const [selectedLog, setSelectedLog] = useState<AuditLogWithUser | null>(null)
  const [isChangesModalOpen, setIsChangesModalOpen] = useState(false)

  const locale = typeof window !== 'undefined' ? 
    document.documentElement.lang || 'en' : 'en'

  // Fetch audit logs
  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })
      
      if (search) params.append('search', search)
      if (actionFilter) params.append('action', actionFilter)
      if (entityFilter) params.append('entity', entityFilter)

      const response = await fetch(`/api/audit?${params}`)
      const result = await response.json()

      if (result.success) {
        setLogs(result.data.logs)
        setTotal(result.data.total)
        setTotalPages(result.data.totalPages)
      } else {
        toast.error(result.error?.message || t('errors.serverError'))
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      toast.error(t('errors.networkError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, pageSize])

  const handleSearch = () => {
    setPage(1)
    fetchLogs()
  }

  const handleViewChanges = (log: AuditLogWithUser) => {
    setSelectedLog(log)
    setIsChangesModalOpen(true)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-accent-100 text-accent-800 dark:bg-accent-900 dark:text-accent-200'
      case 'UPDATE':
        return 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
      case 'DELETE':
        return 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const renderChanges = (log: AuditLogWithUser) => {
    if (!log.changes) {
      return <p className="text-gray-500 dark:text-gray-400">No changes recorded</p>
    }

    const changes = log.changes as any
    const oldValue = changes.oldValue || changes.before
    const newValue = changes.newValue || changes.after || changes.data

    return (
      <div className="space-y-4">
        {newValue && !oldValue && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('audit.new')}
            </h4>
            <pre className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(newValue, null, 2)}
            </pre>
          </div>
        )}
        
        {oldValue && newValue && (
          <>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t('audit.before')}
              </h4>
              <pre className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(oldValue, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t('audit.after')}
              </h4>
              <pre className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(newValue, null, 2)}
              </pre>
            </div>
          </>
        )}
        
        {oldValue && !newValue && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('audit.deleted')}
            </h4>
            <pre className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(oldValue, null, 2)}
            </pre>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t('audit.title')}
        </h1>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Select
            options={[
              { value: '', label: t('audit.filterByAction') },
              { value: 'CREATE', label: t('audit.actions.CREATE') },
              { value: 'UPDATE', label: t('audit.actions.UPDATE') },
              { value: 'DELETE', label: t('audit.actions.DELETE') },
            ]}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          />
          <Select
            options={[
              { value: '', label: t('audit.filterByEntity') },
              { value: 'InventoryItem', label: t('audit.entities.InventoryItem') },
              { value: 'Product', label: t('audit.entities.Product') },
              { value: 'User', label: t('audit.entities.User') },
              { value: 'Transaction', label: t('audit.entities.Transaction') },
            ]}
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={handleSearch} size="small">
            {t('common.search')}
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              setSearch('')
              setActionFilter('')
              setEntityFilter('')
              setPage(1)
              fetchLogs()
            }}
          >
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {t('common.loading')}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {t('audit.noLogs')}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('audit.timestamp')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('audit.user')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('audit.action')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('audit.entity')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('audit.entityId')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('audit.ipAddress')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr 
                      key={log.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => handleViewChanges(log)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <div>
                          <div className="font-medium">{log.user.name}</div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {log.user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                          {t(`audit.actions.${log.action}` as any) || log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {t(`audit.entities.${log.entityType}` as any) || log.entityType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {log.entityId ? `${log.entityId.substring(0, 8)}...` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {log.ipAddress || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="small"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewChanges(log)
                            }}
                          >
                            {t('audit.viewChanges')}
                          </Button>
                          {log.entityType === 'InventoryItem' && log.entityId && (
                            <Button
                              size="small"
                              variant="secondary"
                              onClick={async (e) => {
                                e.stopPropagation()
                                // Navigate to data log with item filter
                                const locale = typeof window !== 'undefined' ? 
                                  document.documentElement.lang || 'en' : 'en'
                                window.location.href = `/${locale}/data-log?search=${log.entityId}`
                              }}
                              title="View item in Data Log"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} results
                </div>
                <div className="flex gap-2">
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    {t('common.previous')}
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Changes Modal */}
      <Modal
        isOpen={isChangesModalOpen}
        onClose={() => {
          setIsChangesModalOpen(false)
          setSelectedLog(null)
        }}
        title={t('audit.changes')}
        size="large"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('audit.user')}</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{selectedLog.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('audit.timestamp')}</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(selectedLog.timestamp)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('audit.action')}</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {t(`audit.actions.${selectedLog.action}` as any) || selectedLog.action}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('audit.entity')}</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {t(`audit.entities.${selectedLog.entityType}` as any) || selectedLog.entityType}
                  </p>
                  {selectedLog.entityType === 'InventoryItem' && selectedLog.entityId && selectedLog.action !== 'DELETE' && (
                    <button
                      onClick={() => {
                        const locale = typeof window !== 'undefined' ? 
                          document.documentElement.lang || 'en' : 'en'
                        window.location.href = `/${locale}/data-log?search=${selectedLog.entityId}`
                      }}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm flex items-center gap-1"
                      title="View item in Data Log"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      View Item
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Show item details if available */}
            {selectedLog.entityType === 'InventoryItem' && selectedLog.changes && (() => {
              const changes = selectedLog.changes as any
              const itemData = changes.newValue || changes.after || changes.data || changes.oldValue || changes.before
              return itemData && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
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
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    Item Details
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {itemData.itemName && (
                      <div>
                        <span className="text-blue-700 dark:text-blue-300 font-medium">Item:</span>
                        <p className="text-blue-900 dark:text-blue-100">{itemData.itemName}</p>
                      </div>
                    )}
                    {itemData.batch && (
                      <div>
                        <span className="text-blue-700 dark:text-blue-300 font-medium">Batch:</span>
                        <p className="text-blue-900 dark:text-blue-100 font-mono text-xs">{itemData.batch}</p>
                      </div>
                    )}
                    {itemData.quantity !== undefined && (
                      <div>
                        <span className="text-blue-700 dark:text-blue-300 font-medium">Quantity:</span>
                        <p className="text-blue-900 dark:text-blue-100">{itemData.quantity}</p>
                      </div>
                    )}
                    {itemData.destination && (
                      <div>
                        <span className="text-blue-700 dark:text-blue-300 font-medium">Destination:</span>
                        <p className="text-blue-900 dark:text-blue-100">{itemData.destination}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
            
            {renderChanges(selectedLog)}
          </div>
        )}
      </Modal>
    </div>
  )
}
