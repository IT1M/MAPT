'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { companyInfoSchema } from '@/utils/settings-validation'
import type { CompanyInformation } from '@/types/settings'

interface CompanyInfoProps {
  onSave?: (data: CompanyInformation) => void
}

export function CompanyInfo({ onSave }: CompanyInfoProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [formData, setFormData] = useState<CompanyInformation>({
    name: '',
    logo: undefined,
    fiscalYearStart: 1,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/settings')
        
        if (!response.ok) {
          throw new Error('Failed to fetch settings')
        }

        const data = await response.json()
        
        if (data.success && data.data.settings) {
          const settings = data.data.settings
          
          // Extract company settings from the settings object
          const companySettings: CompanyInformation = {
            name: settings.general?.find((s: any) => s.key === 'company_name')?.value || '',
            logo: settings.general?.find((s: any) => s.key === 'company_logo')?.value,
            fiscalYearStart: settings.general?.find((s: any) => s.key === 'fiscal_year_start')?.value || 1,
            timezone: settings.general?.find((s: any) => s.key === 'timezone')?.value || Intl.DateTimeFormat().resolvedOptions().timeZone,
          }
          
          setFormData(companySettings)
        }
      } catch (err) {
        console.error('Error fetching settings:', err)
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleChange = (field: keyof CompanyInformation, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    setSuccessMessage(null)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, logo: 'File size must be less than 5MB' }))
      return
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors((prev) => ({ ...prev, logo: 'File must be a JPEG, PNG, or WebP image' }))
      return
    }

    try {
      // Convert to base64 for storage
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        handleChange('logo', base64String)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Error uploading logo:', err)
      setErrors((prev) => ({ ...prev, logo: 'Failed to upload logo' }))
    }
  }

  const handleRemoveLogo = () => {
    handleChange('logo', undefined)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form data
    const validation = companyInfoSchema.safeParse(formData)
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      setSuccessMessage(null)

      // Convert to settings format
      const settingsToUpdate = [
        { key: 'company_name', value: formData.name },
        { key: 'fiscal_year_start', value: formData.fiscalYearStart },
        { key: 'timezone', value: formData.timezone },
      ]

      if (formData.logo) {
        settingsToUpdate.push({ key: 'company_logo', value: formData.logo })
      }

      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: settingsToUpdate }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to update settings')
      }

      setSuccessMessage('Company information updated successfully')
      onSave?.(formData)
    } catch (err) {
      console.error('Error saving settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ]

  // Get list of timezones
  const timezones = Intl.supportedValuesOf('timeZone')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading company information...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Company Information
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure your company details and preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Name */}
        <div>
          <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Company Name
          </label>
          <input
            type="text"
            id="company-name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            placeholder="Enter company name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
          )}
        </div>

        {/* Company Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Company Logo
          </label>
          <div className="mt-2 flex items-center space-x-4">
            {formData.logo ? (
              <div className="relative">
                <img
                  src={formData.logo}
                  alt="Company logo"
                  className="h-20 w-20 object-contain rounded border border-gray-300 dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  aria-label="Remove logo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="h-20 w-20 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div>
              <label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                Upload Logo
              </label>
              <input
                id="logo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoUpload}
                className="sr-only"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, WEBP up to 5MB
              </p>
            </div>
          </div>
          {errors.logo && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.logo}</p>
          )}
        </div>

        {/* Fiscal Year Start */}
        <div>
          <label htmlFor="fiscal-year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Fiscal Year Start Month
          </label>
          <select
            id="fiscal-year"
            value={formData.fiscalYearStart}
            onChange={(e) => handleChange('fiscalYearStart', parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          {errors.fiscalYearStart && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fiscalYearStart}</p>
          )}
        </div>

        {/* Timezone */}
        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Timezone
          </label>
          <select
            id="timezone"
            value={formData.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          {errors.timezone && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.timezone}</p>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <p className="text-sm text-green-800 dark:text-green-400">{successMessage}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
