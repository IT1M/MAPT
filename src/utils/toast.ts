import toastLib from 'react-hot-toast'

/**
 * Show an info toast notification with blue styling
 * @param message - The message to display
 * @param options - Additional toast options
 */
export const toastInfo = (message: string, options?: any) => {
  return toastLib(message, {
    duration: 4000,
    style: {
      background: 'rgb(239 246 255)', // blue-50
      color: 'rgb(30 58 138)', // blue-900
      border: '1px solid rgb(147 197 253)', // blue-300
      padding: '16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    iconTheme: {
      primary: 'rgb(59 130 246)', // blue-500
      secondary: 'white',
    },
    icon: 'ℹ️',
    className: 'dark:!bg-blue-900/20 dark:!text-blue-200 dark:!border-blue-800',
    ...options,
  })
}

/**
 * Toast utility with custom methods for notifications
 */
export const toast = {
  success: (title: string, message?: string) => {
    return toastLib.success(message || title, {
      duration: 4000,
      style: {
        padding: '16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
      }
    })
  },
  error: (title: string, message?: string) => {
    return toastLib.error(message || title, {
      duration: 5000,
      style: {
        padding: '16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
      }
    })
  },
  warning: (title: string, message?: string) => {
    return toastLib(message || title, {
      duration: 4500,
      icon: '⚠️',
      style: {
        background: 'rgb(254 252 232)', // yellow-50
        color: 'rgb(113 63 18)', // yellow-900
        border: '1px solid rgb(253 224 71)', // yellow-300
        padding: '16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
      },
      className: 'dark:!bg-yellow-900/20 dark:!text-yellow-200 dark:!border-yellow-800',
    })
  },
  info: toastInfo,
  loading: (message: string) => {
    return toastLib.loading(message, {
      style: {
        padding: '16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
      }
    })
  },
  dismiss: (toastId?: string) => {
    return toastLib.dismiss(toastId)
  }
}

/**
 * Re-export toast library for direct access
 */
export { toastLib }
export default toast
