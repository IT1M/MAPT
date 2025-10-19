'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { InventoryForm } from '@/components/forms/inventory-form'
import { InventoryItem, Destination } from '@prisma/client'
import { 
  DEFAULT_PAGE_SIZE 
} from '@/utils/constants'
import toast from 'react-hot-toast'

type InventoryItemWithUser = InventoryItem & {
  enteredBy: {
    id: string
    name: string
    email: string
  }
}

export default function InventoryPage() {
  const t = useTranslations()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<InventoryItemWithUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalPages, setTotalPages] = useState(0)
  
  // Filters
  const [search, setSearch] = useState('')
  const [destinationFilter, setDestinationFilter] = useState<string>('')
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItemWithUser | undefined>()
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)

  const locale = typeof window !== 'undefined' ? 
    document.documentElement.lang || 'en' : 'en'

  // Check permissions
  const canWrite = session?.user?.permissions?.includes('inventory:write')
  const canDelete = session?.user?.permissions?.includes('inventory:delete')

  // Fetch inventory items
  const fetchItems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })
      
      if (search) params.append('search', search)
      if (destinationFilter) params.append('destination', destinationFilter)

      const response = await fetch(`/api/inventory?${params}`)
      const result = await response.json()

      if (result.success) {
        setItems(result.data.items)
        setTotal(result.data.total)
        setTotalPages(result.data.totalPages)
      } else {
        toast.error(result.error?.message || t('errors.serverError'))
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast.error(t('errors.networkError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [page, pageSize])

  const handleSearch = () => {
    setPage(1)
    fetchItems()
  }

  const handleAddItem = () => {
    setEditingItem(undefined)
    setIsModalOpen(true)
  }

  const handleEditItem = (item: InventoryItemWithUser) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm(t('inventory.deleteItem') + '?')) {
      return
    }

    setDeletingItemId(id)
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        toast.success(t('success.deleted'))
        fetchItems()
      } else {
        toast.error(result.error?.message || t('errors.serverError'))
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error(t('errors.networkError'))
    } finally {
      setDeletingItemId(null)
    }
  }

  const handleFormSuccess = () => {
    setIsModalOpen(false)
    setEditingItem(undefined)
    fetchItems()
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString(locale)
  }

  const getDestinationColor = (destination: Destination) => {
    switch (destination) {
      case 'MAIS':
        return 'bg-accent-100 text-accent-800 dark:bg-accent-900 dark:text-accent-200'
      case 'FOZAN':
        return 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t('inventory.title')}
        </h1>
        {canWrite && (
          <Button onClick={handleAddItem}>
            {t('inventory.addItem')}
          </Button>
        )}
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
              { value: '', label: t('common.destination') },
              { value: 'MAIS', label: 'MAIS' },
              { value: 'FOZAN', label: 'FOZAN' },
            ]}
            value={destinationFilter}
            onChange={(e) => setDestinationFilter(e.target.value)}
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
              setDestinationFilter('')
              setPage(1)
              fetchItems()
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
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No items found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('inventory.itemName')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('inventory.batch')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('common.quantity')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('inventory.reject')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('common.destination')}
                    </th>
                    {(canWrite || canDelete) && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('common.actions')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.itemName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.batch}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.reject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDestinationColor(item.destination)}`}>
                          {item.destination}
                        </span>
                      </td>
                      {(canWrite || canDelete) && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            {canWrite && (
                              <Button
                                size="small"
                                variant="secondary"
                                onClick={() => handleEditItem(item)}
                              >
                                {t('common.edit')}
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                size="small"
                                variant="danger"
                                onClick={() => handleDeleteItem(item.id)}
                                loading={deletingItemId === item.id}
                                disabled={deletingItemId === item.id}
                              >
                                {t('common.delete')}
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingItem(undefined)
        }}
        title={editingItem ? t('inventory.editItem') : t('inventory.addItem')}
        size="medium"
      >
        <InventoryForm
          item={editingItem as any}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingItem(undefined)
          }}
        />
      </Modal>
    </div>
  )
}
