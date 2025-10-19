import type { Metadata } from 'next'
import { Inter, Cairo } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'
import { SessionProvider } from 'next-auth/react'
import { NotificationProvider } from '@/context/NotificationContext'
import { GlobalSearchProvider } from '@/components/search'
import { PWAProvider } from '@/components/pwa/PWAProvider'
import './globals.css'

// Configure Inter font for English
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Configure Cairo font for Arabic
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Medical Inventory System | Saudi Mais Co.',
    template: '%s | Medical Inventory System',
  },
  description: 'Saudi Mais Co. Medical Products Inventory Management System with AI-powered insights',
  keywords: ['medical inventory', 'inventory management', 'Saudi Arabia', 'healthcare'],
  authors: [{ name: 'Saudi Mais Co.' }],
  creator: 'Saudi Mais Co.',
  publisher: 'Saudi Mais Co.',
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  themeColor: '#0d9488',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mais Inventory',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ar_SA',
    title: 'Medical Inventory System | Saudi Mais Co.',
    description: 'Saudi Mais Co. Medical Products Inventory Management System with AI-powered insights',
    siteName: 'Medical Inventory System',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${cairo.variable}`}>
      <body className="font-sans antialiased">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
          >
            <NotificationProvider>
              <GlobalSearchProvider>
                <PWAProvider>
                  {children}
                </PWAProvider>
              </GlobalSearchProvider>
            </NotificationProvider>
            <Toaster
            position="top-right"
            containerStyle={{
              top: 20,
              right: 20,
            }}
            toastOptions={{
              // Default duration for all toasts
              duration: 4000,
              // Base styles for all toasts
              style: {
                padding: '16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              },
              // Success toast: green with checkmark icon
              success: {
                duration: 4000,
                style: {
                  background: 'rgb(240 253 244)', // green-50
                  color: 'rgb(22 101 52)', // green-900
                  border: '1px solid rgb(134 239 172)', // green-300
                },
                iconTheme: {
                  primary: 'rgb(34 197 94)', // green-500
                  secondary: 'white',
                },
                icon: '✓',
                className: 'dark:!bg-green-900/20 dark:!text-green-200 dark:!border-green-800',
              },
              // Error toast: red with X icon, 6 second duration
              error: {
                duration: 6000,
                style: {
                  background: 'rgb(254 242 242)', // red-50
                  color: 'rgb(127 29 29)', // red-900
                  border: '1px solid rgb(252 165 165)', // red-300
                },
                iconTheme: {
                  primary: 'rgb(239 68 68)', // red-500
                  secondary: 'white',
                },
                icon: '✕',
                className: 'dark:!bg-red-900/20 dark:!text-red-200 dark:!border-red-800',
              },
              // Info/Loading toast: blue with info icon
              loading: {
                duration: 4000,
                style: {
                  background: 'rgb(239 246 255)', // blue-50
                  color: 'rgb(30 58 138)', // blue-900
                  border: '1px solid rgb(147 197 253)', // blue-300
                },
                iconTheme: {
                  primary: 'rgb(59 130 246)', // blue-500
                  secondary: 'white',
                },
                icon: 'ℹ',
                className: 'dark:!bg-blue-900/20 dark:!text-blue-200 dark:!border-blue-800',
              },
            }}
            />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
