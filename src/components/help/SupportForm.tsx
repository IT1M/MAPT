'use client'

import { useState } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'

const supportSchema = z.object({
  category: z.enum(['technical', 'account', 'feature', 'bug', 'other']),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional()
})

type SupportFormData = z.infer<typeof supportSchema>

export default function SupportForm() {
  const t = useTranslations('help')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [expectedResponseTime, setExpectedResponseTime] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<SupportFormData>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      category: 'technical',
      priority: 'normal'
    }
  })

  async function onSubmit(data: SupportFormData) {
    setSubmitting(true)

    try {
      const res = await fetch('/api/help/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        const result = await res.json()
        setExpectedResponseTime(result.expectedResponseTime)
        setSubmitted(true)
        reset()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to submit support request')
      }
    } catch (error) {
      console.error('Error submitting support request:', error)
      alert('Failed to submit support request')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 dark:bg-teal-900/40 rounded-full mb-4">
          <PaperAirplaneIcon className="h-8 w-8 text-teal-600 dark:text-teal-400" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('supportRequestSubmitted')}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('supportRequestConfirmation')}
        </p>
        
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
          {t('expectedResponseTime')}: <strong>{expectedResponseTime}</strong>
        </p>
        
        <button
          onClick={() => setSubmitted(false)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          {t('submitAnother')}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('category')} <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          {...register('category')}
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="technical">{t('categoryTechnical')}</option>
          <option value="account">{t('categoryAccount')}</option>
          <option value="feature">{t('categoryFeature')}</option>
          <option value="bug">{t('categoryBug')}</option>
          <option value="other">{t('categoryOther')}</option>
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category.message}</p>
        )}
      </div>

      {/* Priority */}
      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('priority')}
        </label>
        <select
          id="priority"
          {...register('priority')}
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="low">{t('priorityLow')}</option>
          <option value="normal">{t('priorityNormal')}</option>
          <option value="high">{t('priorityHigh')}</option>
          <option value="urgent">{t('priorityUrgent')}</option>
        </select>
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('subject')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="subject"
          {...register('subject')}
          placeholder={t('subjectPlaceholder')}
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
        />
        {errors.subject && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.subject.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('description')} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={8}
          placeholder={t('descriptionPlaceholder')}
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('descriptionHelp')}
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end space-x-4">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('submitting')}
            </>
          ) : (
            <>
              <PaperAirplaneIcon className="h-5 w-5 mr-2" />
              {t('submitRequest')}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
