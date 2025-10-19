'use client'

/**
 * App Providers
 * Wraps all client-side providers and initializes global handlers
 */

import { useEffect } from 'react'
import { ToastProvider } from '@/components/ui/Toast'
import { setupGlobalErrorHandlers } from '@/utils/error-handler-enhanced'

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Setup global error handlers on mount
  useEffect(() => {
    setupGlobalErrorHandlers()
  }, [])
  
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  )
}
