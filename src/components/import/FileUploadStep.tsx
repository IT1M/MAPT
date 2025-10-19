'use client'

import { useState, useCallback, useRef } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { Upload, FileSpreadsheet, AlertCircle, X } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { ImportFile, ParsedData } from '@/types/import'

interface FileUploadStepProps {
  onFileUpload: (file: ImportFile, data: ParsedData) => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export default function FileUploadStep({ onFileUpload }: FileUploadStepProps) {
  const t = useTranslations('import.upload')
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseFile = useCallback(
    async (file: File) => {
      setIsProcessing(true)
      setError(null)

      try {
        const fileName = file.name.toLowerCase()
        const isCsv = fileName.endsWith('.csv')
        const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')

        if (!isCsv && !isExcel) {
          throw new Error(t('invalidFileType'))
        }

        if (file.size > MAX_FILE_SIZE) {
          throw new Error(t('fileTooLarge'))
        }

        const fileBuffer = await file.arrayBuffer()
        const fileContent = Buffer.from(fileBuffer)

        let headers: string[] = []
        let rows: any[] = []

        if (isCsv) {
          const csvText = fileContent.toString('utf-8')
          const parseResult = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
          })
          rows = parseResult.data
          headers = parseResult.meta.fields || []
        } else if (isExcel) {
          const workbook = XLSX.read(fileContent, { type: 'buffer' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          rows = XLSX.utils.sheet_to_json(worksheet)
          if (rows.length > 0) {
            headers = Object.keys(rows[0])
          }
        }

        if (rows.length === 0) {
          throw new Error(t('emptyFile'))
        }

        if (rows.length > 10000) {
          throw new Error(t('tooManyRows'))
        }

        const preview = rows.slice(0, 5)

        const importFile: ImportFile = {
          file,
          name: file.name,
          size: file.size,
          type: isCsv ? 'csv' : 'excel',
        }

        const parsedData: ParsedData = {
          headers,
          rows,
          preview,
        }

        onFileUpload(importFile, parsedData)
      } catch (err: any) {
        setError(err.message || t('parseError'))
      } finally {
        setIsProcessing(false)
      }
    },
    [onFileUpload, t]
  )

  const handleFileSelect = useCallback(
    (file: File) => {
      setSelectedFile(file)
      parseFile(file)
    },
    [parseFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect]
  )

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {t('title')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('description')}</p>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging
            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {!selectedFile && !isProcessing && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div>
              <p className="text-base font-medium text-gray-900 dark:text-white mb-1">
                {t('dragDrop')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('or')}</p>
            </div>
            <button
              onClick={handleBrowseClick}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              {t('browse')}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('supportedFormats')}</p>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('processing')}</p>
          </div>
        )}

        {selectedFile && !isProcessing && !error && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-teal-100 dark:bg-teal-900/30 rounded-full">
                <FileSpreadsheet className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
            <div>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <button
              onClick={handleRemoveFile}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {t('remove')}
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-200">{t('error')}</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
          {t('instructions.title')}
        </h4>
        <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
          <li>• {t('instructions.format')}</li>
          <li>• {t('instructions.size')}</li>
          <li>• {t('instructions.headers')}</li>
          <li>• {t('instructions.required')}</li>
        </ul>
      </div>
    </div>
  )
}
