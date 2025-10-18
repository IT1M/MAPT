'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
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
    if (!log.oldValue && !log.newValue) {
      return <p className="text-gray-500 dark:text-gray-400">No changes recorded</p>
    }

    return (
      <div className="space-y-4">
        {log.newValue && !log.oldValue && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('audit.new')}
            </h4>
            <pre className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(log.newValue, null, 2)}
            </pre>
          </div>
        )}
        
        {log.oldValue && log.newValue && (
          <>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t('audit.before')}
              </h4>
              <pre className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(log.oldValue, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t('audit.after')}
              </h4>
              <pre className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(log.newValue, null, 2)}
              </pre>
            </div>
          </>
        )}
        
        {log.oldValue && !log.newValue && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('audit.deleted')}
            </h4>
            <pre className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(log.oldValue, null, 2)}
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
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
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
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => handleViewChanges(log)}
                        >
                          {t('audit.viewChanges')}
                        </Button>
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
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {t(`audit.entities.${selectedLog.entityType}` as any) || selectedLog.entityType}
                </p>
              </div>
            </div>
            {renderChanges(selectedLog)}
          </div>
        )}
      </Modal>
    </div>
  )
}
