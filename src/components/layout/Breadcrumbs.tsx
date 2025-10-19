'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from '@/hooks/useTranslations'
import { useLocale } from '@/hooks/useLocale'
import { ChevronRight, Home } from 'lucide-react'
import { Fragment, useState, useEffect } from 'react'

export interface BreadcrumbItem {
  label: string
  path?: string // undefined for current page
  icon?: React.ReactNode
}

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[] // Optional manual override
  maxItems?: number // Default: 4
  className?: string
}

/**
 * Breadcrumbs component that shows hierarchical navigation
 * Automatically generates breadcrumbs from pathname or accepts manual items
 */
export function Breadcrumbs({ items, maxItems = 4, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname()
  const locale = useLocale() as 'en' | 'ar'
  const t = useTranslations('navigation')
  const [isMounted, setIsMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Generate breadcrumbs from pathname if not provided
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname, locale, t, isMounted)

  // Truncate breadcrumbs if they exceed maxItems
  const displayItems = truncateBreadcrumbs(breadcrumbItems, maxItems)

  // Reverse order for RTL
  const orderedItems = locale === 'ar' ? [...displayItems].reverse() : displayItems

  if (displayItems.length === 0) {
    return null
  }

  // Show simple version during SSR to prevent hydration mismatch
  if (!isMounted) {
    return (
      <nav
        className={`flex items-center space-x-2 rtl:space-x-reverse ${className}`}
        aria-label="Breadcrumb"
        suppressHydrationWarning
      >
        <ol className="flex items-center space-x-2 rtl:space-x-reverse" suppressHydrationWarning>
          <li className="flex items-center">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {orderedItems[orderedItems.length - 1]?.label || 'Dashboard'}
            </span>
          </li>
        </ol>
      </nav>
    )
  }

  return (
    <nav
      className={`flex items-center space-x-2 rtl:space-x-reverse ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2 rtl:space-x-reverse" role="list">
        {orderedItems.map((item, index) => {
          const isLast = index === orderedItems.length - 1
          const isEllipsis = item.label === '...'

          return (
            <Fragment key={`${item.path}-${index}`}>
              {index > 0 && (
                <li aria-hidden="true">
                  <ChevronRight
                    className={`w-4 h-4 text-gray-400 dark:text-gray-500 ${
                      locale === 'ar' ? 'rotate-180' : ''
                    }`}
                  />
                </li>
              )}
              <li className="flex items-center">
                {isEllipsis ? (
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {item.label}
                  </span>
                ) : isLast || !item.path ? (
                  <span
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100"
                    aria-current="page"
                  >
                    {item.icon}
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.path}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-1 -mx-1"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * Generate breadcrumbs from pathname
 */
function generateBreadcrumbsFromPath(
  pathname: string,
  locale: 'en' | 'ar',
  t: any,
  isMounted: boolean = true
): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  
  // Remove locale from segments (first segment)
  const pathSegments = segments.slice(1)
  
  if (pathSegments.length === 0) {
    return [
      {
        label: t('dashboard'),
        path: `/${locale}/dashboard`,
        icon: isMounted ? <Home className="w-4 h-4" /> : undefined,
      },
    ]
  }

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: t('dashboard'),
      path: `/${locale}/dashboard`,
      icon: isMounted ? <Home className="w-4 h-4" /> : undefined,
    },
  ]

  pathSegments.forEach((segment, index) => {
    const path = '/' + segments.slice(0, index + 2).join('/')
    const isLast = index === pathSegments.length - 1
    
    // Try to get translation, fallback to capitalized segment
    const label = getSegmentLabel(segment, t)
    
    breadcrumbs.push({
      label,
      path: isLast ? undefined : path,
    })
  })

  return breadcrumbs
}

/**
 * Get label for a path segment
 */
function getSegmentLabel(
  segment: string,
  t: any
): string {
  // Map of common segments to translation keys
  const segmentMap: Record<string, string> = {
    'dashboard': 'dashboard',
    'data-entry': 'dataEntry',
    'data-log': 'dataLog',
    'inventory': 'inventory',
    'analytics': 'analytics',
    'reports': 'reports',
    'backup': 'backup',
    'audit': 'audit',
    'settings': 'settings',
  }

  const translationKey = segmentMap[segment]
  if (translationKey) {
    return t(translationKey)
  }

  // Fallback: capitalize and replace hyphens with spaces
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Truncate breadcrumbs if they exceed maxItems
 * Shows first item, ellipsis, and last 2 items
 */
function truncateBreadcrumbs(
  items: BreadcrumbItem[],
  maxItems: number
): BreadcrumbItem[] {
  if (items.length <= maxItems) {
    return items
  }

  // Show: first item, ..., second-to-last item, last item
  return [
    items[0],
    { label: '...', path: undefined },
    ...items.slice(-2),
  ]
}

/**
 * Breadcrumbs with back button variant
 */
export function BreadcrumbsWithBack({
  items,
  maxItems,
  className,
  onBack,
}: BreadcrumbsProps & { onBack?: () => void }) {
  const pathname = usePathname()
  const locale = useLocale()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      // Navigate to parent path
      const segments = pathname.split('/').filter(Boolean)
      if (segments.length > 2) {
        const parentPath = '/' + segments.slice(0, -1).join('/')
        window.location.href = parentPath
      } else {
        window.location.href = `/${locale}/dashboard`
      }
    }
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={handleBack}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label="Go back"
      >
        <ChevronRight className={`w-5 h-5 text-gray-500 dark:text-gray-400 ${locale === 'ar' ? '' : 'rotate-180'}`} />
      </button>
      <Breadcrumbs items={items} maxItems={maxItems} />
    </div>
  )
}
