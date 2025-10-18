import { useState } from 'react'
import { inventoryItemSchema } from '@/utils/validators'
import toast from 'react-hot-toast'
import type { Destination } from '@prisma/client'

export interface FormState {
  itemName: string
  batch: string
  quantity: string
  reject: string
  destination: Destination
  category: string
  notes: string
}

export interface FormMeta {
  isSubmitting: boolean
  isDirty: boolean
  lastSaved: Date | null
  errors: Partial<Record<keyof FormState, string>>
  batchWarning: string | null
  lastError: string | null
  canRetry: boolean
}

interface UseDataEntryFormOptions {
  initialData?: Partial<FormState>
  onSuccess?: (data: any) => void
}

export function useDataEntryForm(options: UseDataEntryFormOptions = {}) {
  const [formData, setFormData] = useState<FormState>({
    itemName: '',
    batch: '',
    quantity: '',
    reject: '0',
    destination: 'MAIS',
    category: '',
    notes: '',
    ...options.initialData,
  })

  const [meta, setMeta] = useState<FormMeta>({
    isSubmitting: false,
    isDirty: false,
    lastSaved: null,
    errors: {},
    batchWarning: null,
    lastError: null,
    canRetry: false,
  })

  const updateField = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setMeta((prev) => ({ ...prev, isDirty: true }))

    // Clear error for this field
    if (meta.errors[field]) {
      setMeta((prev) => ({
        ...prev,
        errors: { ...prev.errors, [field]: undefined },
      }))
    }
  }

  const validate = (): boolean => {
    try {
      const result = inventoryItemSchema.safeParse({
        itemName: formData.itemName,
        batch: formData.batch,
        quantity: parseInt(formData.quantity),
        reject: parseInt(formData.reject),
        destination: formData.destination,
        category: formData.category || undefined,
        notes: formData.notes || undefined,
      })

      if (!result.success) {
        const errors: Partial<Record<keyof FormState, string>> = {}
        result.error.errors.forEach((err) => {
          const field = err.path[0] as keyof FormState
          if (field) {
            errors[field] = err.message
          }
        })
        setMeta((prev) => ({ ...prev, errors }))
        return false
      }

      setMeta((prev) => ({ ...prev, errors: {} }))
      return true
    } catch (error) {
      return false
    }
  }

  const submit = async () => {
    if (!validate()) {
      toast.error('Please fix validation errors')
      return false
    }

    setMeta((prev) => ({ ...prev, isSubmitting: true }))

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: formData.itemName,
          batch: formData.batch,
          quantity: parseInt(formData.quantity),
          reject: parseInt(formData.reject),
          destination: formData.destination,
          category: formData.category || undefined,
          notes: formData.notes || undefined,
        }),
      })

      // Handle network errors (response not ok)
      if (!response.ok) {
        let result
        try {
          result = await response.json()
        } catch (parseError) {
          // If response is not JSON, handle as generic server error
          console.error('Failed to parse error response:', parseError)
          toast.error('Server error. Please try again or contact support.')
          return null
        }

        // Handle authentication errors (401)
        if (response.status === 401) {
          console.error('Authentication error:', result)
          setMeta((prev) => ({ 
            ...prev, 
            lastError: 'Session expired. Please log in again.',
            canRetry: false 
          }))
          toast.error('Session expired. Please log in again.')
          // Redirect to login page after a short delay
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
          return null
        }

        // Handle authorization errors (403)
        if (response.status === 403) {
          console.error('Authorization error:', result)
          setMeta((prev) => ({ 
            ...prev, 
            lastError: 'You do not have permission to perform this action.',
            canRetry: false 
          }))
          toast.error('You do not have permission to perform this action.')
          return null
        }

        // Handle validation errors (422)
        if (response.status === 422 && result.error?.details) {
          console.error('Validation errors:', result.error.details)
          // Map validation errors to fields
          const errors: Partial<Record<keyof FormState, string>> = {}
          result.error.details.forEach((detail: any) => {
            const field = detail.path?.[0] as keyof FormState
            if (field) {
              errors[field] = detail.message
            }
          })
          setMeta((prev) => ({ 
            ...prev, 
            errors,
            lastError: 'Please fix the validation errors and try again.',
            canRetry: false 
          }))
          toast.error('Please fix the validation errors and try again.')
          return null
        }

        // Handle server errors (500+)
        if (response.status >= 500) {
          console.error('Server error:', result)
          const errorMsg = 'Server error occurred. Please try again later or contact support if the problem persists.'
          setMeta((prev) => ({ 
            ...prev, 
            lastError: errorMsg,
            canRetry: true 
          }))
          toast.error(errorMsg, { duration: 6000 })
          return null
        }

        // Handle other errors
        console.error('API error:', result)
        const errorMsg = result.error?.message || 'Failed to save item. Please try again.'
        setMeta((prev) => ({ 
          ...prev, 
          lastError: errorMsg,
          canRetry: true 
        }))
        toast.error(errorMsg)
        return null
      }

      // Parse successful response
      const result = await response.json()

      if (result.success) {
        // Clear any previous errors on success
        setMeta((prev) => ({ 
          ...prev, 
          lastError: null,
          canRetry: false 
        }))
        
        const lastDestination = formData.destination
        reset(lastDestination)
        
        if (options.onSuccess) {
          options.onSuccess(result.data)
        }
        
        return result.data
      }

      // Unexpected response format
      console.error('Unexpected response format:', result)
      const errorMsg = 'Unexpected response from server. Please try again.'
      setMeta((prev) => ({ 
        ...prev, 
        lastError: errorMsg,
        canRetry: true 
      }))
      toast.error(errorMsg)
      return null
    } catch (error) {
      // Handle network errors (fetch failed)
      console.error('Network error:', error)
      
      // Check if it's a network error or timeout
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const errorMsg = 'Network error. Please check your internet connection and try again.'
        setMeta((prev) => ({ 
          ...prev, 
          lastError: errorMsg,
          canRetry: true 
        }))
        toast.error(errorMsg, { 
          duration: 6000,
          icon: '🔌'
        })
      } else {
        // Generic error
        const errorMsg = 'An unexpected error occurred. Please try again.'
        setMeta((prev) => ({ 
          ...prev, 
          lastError: errorMsg,
          canRetry: true 
        }))
        toast.error(errorMsg)
      }
      
      return null
    } finally {
      setMeta((prev) => ({ ...prev, isSubmitting: false }))
    }
  }

  const reset = (preserveDestination?: Destination) => {
    setFormData({
      itemName: '',
      batch: '',
      quantity: '',
      reject: '0',
      destination: preserveDestination || formData.destination,
      category: '',
      notes: '',
    })
    setMeta({
      isSubmitting: false,
      isDirty: false,
      lastSaved: null,
      errors: {},
      batchWarning: null,
      lastError: null,
      canRetry: false,
    })
  }

  return {
    formData,
    meta,
    updateField,
    validate,
    submit,
    reset,
  }
}
