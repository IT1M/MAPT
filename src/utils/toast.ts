import toast from 'react-hot-toast'

/**
 * Show an info toast notification with blue styling
 * @param message - The message to display
 * @param options - Additional toast options
 */
export const toastInfo = (message: string, options?: any) => {
  return toast(message, {
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
 * Re-export toast for convenience
 */
export { toast }
export default toast
