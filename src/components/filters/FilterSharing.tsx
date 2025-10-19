'use client'

import React, { useState } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { FilterGroup } from '@/types/filters'
import { exportFilterGroup, importFilterGroup } from '@/utils/filter-builder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/utils/toast'

interface FilterSharingProps {
  filterGroup: FilterGroup
  filterName: string
  currentPage: string
  onImport: (filterGroup: FilterGroup, name: string) => void
}

export function FilterSharing({
  filterGroup,
  filterName,
  currentPage,
  onImport,
}: FilterSharingProps) {
  const t = useTranslations('filters')
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importCode, setImportCode] = useState('')
  const [shareableUrl, setShareableUrl] = useState('')

  const handleExport = () => {
    const encoded = exportFilterGroup(filterGroup, filterName, currentPage)
    const url = `${window.location.origin}${window.location.pathname}?filter=${encoded}`
    setShareableUrl(url)
    setShowExportModal(true)
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl)
      toast.success(t('success.urlCopied'))
    } catch (error) {
      toast.error(t('errors.copyFailed'))
    }
  }

  const handleCopyCode = async () => {
    const encoded = exportFilterGroup(filterGroup, filterName, currentPage)
    try {
      await navigator.clipboard.writeText(encoded)
      toast.success(t('success.codeCopied'))
    } catch (error) {
      toast.error(t('errors.copyFailed'))
    }
  }

  const handleImport = () => {
    if (!importCode.trim()) {
      toast.error(t('errors.codeRequired'))
      return
    }

    const imported = importFilterGroup(importCode.trim())
    if (!imported) {
      toast.error(t('errors.invalidCode'))
      return
    }

    onImport(imported.filters, imported.name)
    toast.success(t('success.filterImported'))
    setShowImportModal(false)
    setImportCode('')
  }

  const handleDownloadJson = () => {
    const data = {
      name: filterName,
      filters: filterGroup,
      page: currentPage,
      version: '1.0',
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `filter-${filterName.replace(/\s+/g, '-').toLowerCase()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success(t('success.filterExported'))
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleExport}
          disabled={filterGroup.filters.length === 0}
          className="flex-1"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {t('shareFilter')}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setShowImportModal(true)}
          className="flex-1"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {t('importFilter')}
        </Button>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('shareFilterTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Shareable URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('shareableUrl')}
                </label>
                <div className="flex gap-2">
                  <Input
                    value={shareableUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCopyUrl}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('shareUrlDescription')}
                </p>
              </div>

              {/* Share Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('shareCode')}
                </label>
                <div className="flex gap-2">
                  <Input
                    value={exportFilterGroup(filterGroup, filterName, currentPage)}
                    readOnly
                    className="flex-1 font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCopyCode}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('shareCodeDescription')}
                </p>
              </div>

              {/* Download JSON */}
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDownloadJson}
                  className="w-full"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {t('downloadJson')}
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('downloadJsonDescription')}
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                type="button"
                variant="primary"
                onClick={() => setShowExportModal(false)}
              >
                {t('close')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('importFilterTitle')}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false)
                  setImportCode('')
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('pasteCode')}
                </label>
                <textarea
                  value={importCode}
                  onChange={(e) => setImportCode(e.target.value)}
                  placeholder={t('pasteCodePlaceholder')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-xs focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('pasteCodeDescription')}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowImportModal(false)
                  setImportCode('')
                }}
                className="flex-1"
              >
                {t('cancel')}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleImport}
                className="flex-1"
                disabled={!importCode.trim()}
              >
                {t('import')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
