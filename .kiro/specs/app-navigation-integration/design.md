# Design Document

## Overview

This design document outlines the architecture and implementation strategy for integrating all application pages into a cohesive system with professional navigation, routing, and user experience enhancements. The solution builds upon existing layout components (Sidebar, Header, Navigation) and extends them with additional features including breadcrumbs, loading states, empty states, error handling, and performance optimizations.

### Current State Analysis

The application already has:
- Basic sidebar navigation with role-based filtering
- Header component with breadcrumbs, theme toggle, and locale switcher
- Mobile navigation with overlay
- Route protection via middleware
- Session management with NextAuth
- Internationalization with next-intl
- RTL support for Arabic

### Design Goals

1. **Enhance existing components** rather than rebuild from scratch
2. **Add missing features**: notifications, search, advanced breadcrumbs, loading/empty states
3. **Improve UX**: smooth animations, better feedback, accessibility
4. **Optimize performance**: code splitting, caching, bundle size
5. **Ensure consistency**: unified design system, predictable behavior
6. **Maintain flexibility**: easy to extend and customize

## Architecture

### Component Hierarchy

```
App Root
├── LocaleLayout (src/app/[locale]/layout.tsx)
│   ├── SessionProvider
│   ├── NextIntlClientProvider
│   ├── RTLProvider
│   ├── ThemeProvider (next-themes)
│   └── AppContextProvider (new)
│       ├── NotificationProvider (new)
│       └── Main Layout Structure
│           ├── Sidebar (enhanced)
│           ├── Header (enhanced)
│           └── Main Content
│               ├── Breadcrumbs (new component)
│               ├── Page Content
│               └── Loading/Empty/Error States
```

### State Management Strategy


**Global State (React Context)**
- User session and role (NextAuth)
- Theme preference (next-themes)
- Locale preference (next-intl)
- Notifications (new NotificationContext)
- Sidebar collapsed state (localStorage + context)

**Local State (Component State)**
- Dropdown open/close states
- Modal visibility
- Form data
- Loading indicators

**Server State (SWR/React Query - future)**
- API data caching
- Automatic revalidation
- Optimistic updates

### Routing Architecture

**Protected Routes**
- All routes except `/login` and `/` require authentication
- Middleware checks session and role permissions
- Redirects to login with callback URL if unauthenticated
- Shows access denied page if insufficient permissions

**Route Structure**
```
/[locale]
  /dashboard          - All roles
  /data-entry         - ADMIN, SUPERVISOR, DATA_ENTRY
  /data-log           - All roles
  /inventory          - ADMIN, SUPERVISOR, DATA_ENTRY
  /analytics          - ADMIN, MANAGER, SUPERVISOR, AUDITOR
  /reports            - ADMIN, MANAGER, SUPERVISOR, AUDITOR
  /backup             - ADMIN, MANAGER
  /audit              - ADMIN, AUDITOR
  /audit/dashboard    - ADMIN, AUDITOR
  /settings           - All roles (sections restricted by role)
  /settings/users     - ADMIN only
```

## Components and Interfaces

### 1. Enhanced Sidebar Component

**File**: `src/components/layout/Sidebar.tsx` (enhance existing)

**New Features to Add**:
- Badge support for menu items (e.g., "NEW", notification counts)
- Keyboard navigation (arrow keys, Enter)
- Active state with left border indicator
- Smooth animations for all state changes
- Better tooltip positioning


**Interface**:
```typescript
interface NavigationItem {
  id: string
  label: string
  path: string
  icon: React.ReactNode
  roles: UserRole[]
  badge?: {
    text: string
    variant: 'new' | 'info' | 'warning' | 'error'
    count?: number
  }
  children?: NavigationItem[] // For nested menus (future)
}

interface SidebarProps {
  className?: string
}
```

**State Management**:
- Collapsed state persisted in localStorage
- Synced across tabs using storage events
- Animated transitions using CSS transitions

**Responsive Behavior**:
- Desktop (≥1024px): Always visible, collapsible
- Tablet (768-1023px): Collapsible with overlay option
- Mobile (<768px): Hidden by default, hamburger menu

### 2. Enhanced Header Component

**File**: `src/components/layout/Header.tsx` (enhance existing)

**New Features to Add**:
- Notifications bell with dropdown
- Global search bar (optional, can be added later)
- Better user menu with profile link
- Sticky behavior with shadow on scroll
- Mobile-optimized layout

**Interface**:
```typescript
interface HeaderProps {
  className?: string
}

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}
```

**Features**:
- Notifications dropdown with unread count badge
- Mark as read functionality
- Link to full notifications page
- User dropdown with Profile, Settings, Logout
- Responsive: simplified on mobile


### 3. Breadcrumbs Component

**File**: `src/components/layout/Breadcrumbs.tsx` (new)

**Purpose**: Provide hierarchical navigation showing user's current location

**Interface**:
```typescript
interface BreadcrumbItem {
  label: string
  path?: string // undefined for current page
  icon?: React.ReactNode
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[] // Optional manual override
  maxItems?: number // Default: 4
  className?: string
}
```

**Features**:
- Auto-generate from pathname
- Localized labels using translations
- Clickable links (except current page)
- Truncate with ellipsis if too many levels
- RTL support with reversed order and icons
- Back button for sub-pages
- Responsive: hide on very small screens

**Generation Logic**:
```typescript
// Example: /en/audit/dashboard
// Generates: Home > Audit > Dashboard

function generateBreadcrumbs(pathname: string, t: TranslationFunction): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const pathSegments = segments.slice(1) // Remove locale
  
  const breadcrumbs: BreadcrumbItem[] = [
    { label: t('navigation.home'), path: `/${segments[0]}/dashboard` }
  ]
  
  pathSegments.forEach((segment, index) => {
    const path = '/' + segments.slice(0, index + 2).join('/')
    const label = t(`navigation.${segment}`, { defaultValue: capitalize(segment) })
    breadcrumbs.push({ label, path: index === pathSegments.length - 1 ? undefined : path })
  })
  
  return breadcrumbs
}
```

### 4. Loading States System

**Files**:
- `src/components/ui/PageLoader.tsx` (new)
- `src/components/ui/SkeletonLoader.tsx` (enhance existing)
- `src/components/ui/ButtonLoader.tsx` (new)

**Page Loader**:
```typescript
interface PageLoaderProps {
  message?: string
  progress?: number // 0-100
}

// Full-screen loader with logo and progress bar
// Used during page transitions
```

**Skeleton Loaders**:
```typescript
// Reusable skeleton components for different content types
<TableSkeleton rows={10} columns={6} />
<ChartSkeleton type="bar" />
<CardSkeleton />
<FormSkeleton fields={5} />
```

**Button Loading State**:
```typescript
<Button loading={isSubmitting} disabled={isSubmitting}>
  Submit
</Button>
// Shows spinner inside button, maintains size
```


### 5. Empty States System

**File**: `src/components/ui/EmptyState.tsx` (new)

**Purpose**: Provide helpful feedback when no data is available

**Interface**:
```typescript
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    href?: string
  }
  illustration?: 'no-data' | 'no-results' | 'no-access' | 'error'
}
```

**Variants**:
- **No Data**: First-time user, no items created yet
- **No Results**: Search/filter returned nothing
- **No Access**: User lacks permissions
- **Error**: Something went wrong

**Usage Examples**:
```typescript
// Data Log - No Items
<EmptyState
  illustration="no-data"
  title={t('dataLog.empty.title')}
  description={t('dataLog.empty.description')}
  action={{
    label: t('dataLog.empty.action'),
    href: `/${locale}/data-entry`
  }}
/>

// Analytics - Insufficient Data
<EmptyState
  illustration="no-data"
  title={t('analytics.empty.title')}
  description={t('analytics.empty.description')}
/>

// Audit - No Logs
<EmptyState
  illustration="no-results"
  title={t('audit.empty.title')}
  action={{
    label: t('audit.empty.resetFilters'),
    onClick: resetFilters
  }}
/>
```

### 6. Error Handling System

**Files**:
- `src/components/ErrorBoundary.tsx` (enhance existing)
- `src/components/ui/ErrorState.tsx` (new)
- `src/app/error.tsx` (enhance existing)
- `src/app/[locale]/access-denied/page.tsx` (new)

**Error Boundary**:
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

// Catches React errors, logs to monitoring service
// Shows user-friendly error page with recovery options
```


**Error State Component**:
```typescript
interface ErrorStateProps {
  error: Error | string
  title?: string
  description?: string
  retry?: () => void
  showDetails?: boolean // Show in dev only
}
```

**API Error Handler**:
```typescript
// src/utils/api-error-handler.ts
export function handleApiError(error: unknown, router: NextRouter) {
  if (error instanceof Response) {
    switch (error.status) {
      case 401:
        router.push('/login?session=expired')
        break
      case 403:
        router.push('/access-denied')
        break
      case 404:
        toast.error('Resource not found')
        break
      case 500:
        toast.error('Server error. Please try again later.')
        break
      default:
        toast.error('An error occurred')
    }
  }
}
```

**Access Denied Page**:
- Shows when user tries to access route without permission
- Explains why access was denied
- Shows required role
- Link back to dashboard
- Contact admin option

### 7. Notification System

**Files**:
- `src/context/NotificationContext.tsx` (new)
- `src/components/notifications/NotificationBell.tsx` (new)
- `src/components/notifications/NotificationDropdown.tsx` (new)
- `src/components/notifications/NotificationItem.tsx` (new)

**Context Interface**:
```typescript
interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionLabel?: string
}
```

**Features**:
- In-memory storage (can be extended to API)
- Persist to localStorage
- Auto-dismiss after timeout (optional)
- Sound/vibration on new notification (optional)
- Desktop notifications (optional, with permission)


### 8. Page Transition System

**File**: `src/components/layout/PageTransition.tsx` (new)

**Purpose**: Smooth animations between page navigations

**Implementation**:
```typescript
'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // Optional

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 200)
    return () => clearTimeout(timer)
  }, [pathname])
  
  return (
    <div className="relative">
      {isLoading && <PageLoader />}
      <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </div>
    </div>
  )
}
```

**Alternative with Framer Motion**:
```typescript
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

**Decision**: Use CSS transitions initially, can upgrade to Framer Motion later if needed

### 9. Keyboard Shortcuts System

**File**: `src/hooks/useKeyboardShortcuts.ts` (enhance existing)

**Global Shortcuts**:
```typescript
const shortcuts = {
  '/': 'Focus search',
  'Ctrl+K': 'Open command palette',
  'Ctrl+N': 'New item (Data Entry)',
  'Ctrl+B': 'Toggle sidebar',
  'Escape': 'Close modal/dropdown',
  'Alt+1-9': 'Navigate to menu item',
  '?': 'Show keyboard shortcuts help'
}
```

**Implementation**:
```typescript
export function useGlobalKeyboardShortcuts() {
  const router = useRouter()
  const locale = useLocale()
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextArea) {
        return
      }
      
      // Handle shortcuts
      if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault()
        // Focus search
      }
      
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        router.push(`/${locale}/data-entry`)
      }
      
      // ... more shortcuts
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, locale])
}
```


## Data Models

### Navigation Configuration

```typescript
// src/config/navigation.ts
export const navigationConfig: NavigationItem[] = [
  {
    id: 'dashboard',
    label: { en: 'Dashboard', ar: 'لوحة التحكم' },
    icon: LayoutDashboard,
    href: '/dashboard',
    roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'DATA_ENTRY', 'AUDITOR']
  },
  {
    id: 'data-entry',
    label: { en: 'Data Entry', ar: 'إدخال البيانات' },
    icon: ClipboardEdit,
    href: '/data-entry',
    roles: ['ADMIN', 'SUPERVISOR', 'DATA_ENTRY'],
    badge: { text: 'NEW', variant: 'info' }
  },
  {
    id: 'data-log',
    label: { en: 'Data Log', ar: 'سجل البيانات' },
    icon: Database,
    href: '/data-log',
    roles: ['ADMIN', 'SUPERVISOR', 'MANAGER', 'DATA_ENTRY', 'AUDITOR']
  },
  {
    id: 'analytics',
    label: { en: 'Analytics', ar: 'التحليلات' },
    icon: BarChart3,
    href: '/analytics',
    roles: ['ADMIN', 'SUPERVISOR', 'MANAGER', 'AUDITOR']
  },
  {
    id: 'backup',
    label: { en: 'Reports & Backup', ar: 'التقارير والنسخ الاحتياطي' },
    icon: FileText,
    href: '/backup',
    roles: ['ADMIN', 'MANAGER']
  },
  {
    id: 'audit',
    label: { en: 'Audit & History', ar: 'التدقيق والسجل' },
    icon: Shield,
    href: '/audit',
    roles: ['ADMIN', 'AUDITOR']
  },
  {
    id: 'settings',
    label: { en: 'Settings', ar: 'الإعدادات' },
    icon: Settings,
    href: '/settings',
    roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'DATA_ENTRY', 'AUDITOR']
  }
]
```

### Route Permissions

```typescript
// src/config/permissions.ts
export const routePermissions: Record<string, UserRole[]> = {
  '/dashboard': ['ADMIN', 'MANAGER', 'SUPERVISOR', 'DATA_ENTRY', 'AUDITOR'],
  '/data-entry': ['ADMIN', 'SUPERVISOR', 'DATA_ENTRY'],
  '/data-log': ['ADMIN', 'SUPERVISOR', 'MANAGER', 'DATA_ENTRY', 'AUDITOR'],
  '/inventory': ['ADMIN', 'SUPERVISOR', 'DATA_ENTRY'],
  '/analytics': ['ADMIN', 'SUPERVISOR', 'MANAGER', 'AUDITOR'],
  '/reports': ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AUDITOR'],
  '/backup': ['ADMIN', 'MANAGER'],
  '/audit': ['ADMIN', 'AUDITOR'],
  '/audit/dashboard': ['ADMIN', 'AUDITOR'],
  '/settings': ['ADMIN', 'MANAGER', 'SUPERVISOR', 'DATA_ENTRY', 'AUDITOR'],
  '/settings/users': ['ADMIN']
}

export function hasPermission(userRole: UserRole, route: string): boolean {
  const allowedRoles = routePermissions[route]
  if (!allowedRoles) return true // Allow if not specified
  return allowedRoles.includes(userRole)
}
```


### User Preferences

```typescript
// src/types/preferences.ts
export interface UserPreferences {
  sidebarCollapsed: boolean
  theme: 'light' | 'dark' | 'system'
  locale: 'en' | 'ar'
  density: 'comfortable' | 'compact' | 'spacious'
  notifications: {
    enabled: boolean
    sound: boolean
    desktop: boolean
  }
}

// Stored in localStorage
const PREFERENCES_KEY = 'user-preferences'

export function savePreferences(prefs: Partial<UserPreferences>) {
  const current = getPreferences()
  const updated = { ...current, ...prefs }
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated))
}

export function getPreferences(): UserPreferences {
  const stored = localStorage.getItem(PREFERENCES_KEY)
  return stored ? JSON.parse(stored) : defaultPreferences
}
```

## Error Handling

### Error Types and Responses

**Authentication Errors (401)**:
- Redirect to login page
- Preserve callback URL
- Show session expired message
- Clear local storage

**Authorization Errors (403)**:
- Show access denied page
- Explain required permissions
- Offer to contact admin
- Link back to dashboard

**Not Found Errors (404)**:
- Show 404 page
- Search functionality
- Link to common pages
- Report broken link option

**Server Errors (500)**:
- Show error page
- Retry button
- Contact support
- Error ID for tracking

**Network Errors**:
- Show offline indicator
- Queue actions for retry
- Notify when back online
- Graceful degradation

### Error Logging

```typescript
// src/utils/error-logger.ts
export function logError(error: Error, context?: Record<string, any>) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error, context)
  }
  
  // Send to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    // Sentry, LogRocket, or custom service
    // sentry.captureException(error, { extra: context })
  }
  
  // Store in local error log for debugging
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    context
  }
  
  const logs = JSON.parse(localStorage.getItem('error-logs') || '[]')
  logs.push(errorLog)
  localStorage.setItem('error-logs', JSON.stringify(logs.slice(-50))) // Keep last 50
}
```


## Testing Strategy

### Unit Tests

**Components to Test**:
- Sidebar: collapsed/expanded state, role filtering, active state
- Header: breadcrumbs generation, dropdown behavior
- Breadcrumbs: path parsing, localization, truncation
- EmptyState: rendering variants, action callbacks
- ErrorBoundary: error catching, recovery
- NotificationContext: add, read, remove operations

**Example Test**:
```typescript
// src/components/layout/__tests__/Sidebar.test.tsx
describe('Sidebar', () => {
  it('filters menu items based on user role', () => {
    const { queryByText } = render(
      <Sidebar />,
      { session: { user: { role: 'DATA_ENTRY' } } }
    )
    
    expect(queryByText('Dashboard')).toBeInTheDocument()
    expect(queryByText('Data Entry')).toBeInTheDocument()
    expect(queryByText('Settings')).not.toBeInTheDocument() // Admin only
  })
  
  it('persists collapsed state to localStorage', () => {
    const { getByLabelText } = render(<Sidebar />)
    const toggleButton = getByLabelText('Collapse sidebar')
    
    fireEvent.click(toggleButton)
    
    expect(localStorage.getItem('sidebar-collapsed')).toBe('true')
  })
})
```

### Integration Tests

**Scenarios to Test**:
- Navigation flow: click menu item → page loads → breadcrumbs update
- Authentication: unauthenticated → redirects to login → login → redirects back
- Authorization: insufficient role → access denied page
- Error handling: API error → error state → retry → success
- Notifications: add notification → appears in bell → mark as read → count updates

### Accessibility Tests

**Requirements**:
- All interactive elements keyboard accessible
- Focus indicators visible
- ARIA labels present
- Screen reader announcements
- Color contrast meets WCAG AA
- Skip to main content link

**Tools**:
- jest-axe for automated checks
- Manual testing with screen reader
- Keyboard-only navigation testing

### Performance Tests

**Metrics to Monitor**:
- Initial bundle size < 500KB
- Page load time < 3s on 3G
- Time to Interactive < 5s
- Lighthouse score > 90
- No layout shifts (CLS < 0.1)

**Tools**:
- Lighthouse CI
- Bundle analyzer
- Chrome DevTools Performance tab


## Performance Optimization

### Code Splitting Strategy

**Route-Based Splitting** (automatic with Next.js):
- Each page is a separate chunk
- Loaded on demand when navigating

**Component-Based Splitting**:
```typescript
// Lazy load heavy components
const AnalyticsCharts = dynamic(() => import('@/components/analytics/charts'), {
  loading: () => <ChartSkeleton />,
  ssr: false
})

const PDFViewer = dynamic(() => import('@/components/reports/PDFViewer'), {
  loading: () => <div>Loading PDF...</div>,
  ssr: false
})

const RichTextEditor = dynamic(() => import('@/components/forms/RichTextEditor'), {
  loading: () => <div>Loading editor...</div>,
  ssr: false
})
```

**Library Splitting**:
- Use tree-shaking for large libraries
- Import only needed components
- Consider alternatives for heavy dependencies

### Caching Strategy

**Static Assets**:
- Images: Next.js Image Optimization
- Fonts: Self-hosted, preloaded
- Icons: SVG sprites or icon font

**API Responses**:
```typescript
// src/hooks/useApiData.ts
export function useApiData<T>(url: string, options?: RequestInit) {
  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000, // 5 seconds
    errorRetryCount: 3
  })
}
```

**Browser Caching**:
- Cache-Control headers for static assets
- Service Worker for offline support (future)
- IndexedDB for large datasets (future)

### Bundle Optimization

**Techniques**:
1. Remove unused dependencies
2. Use production builds
3. Enable compression (gzip/brotli)
4. Minimize CSS (Tailwind purge)
5. Optimize images (WebP, proper sizing)
6. Lazy load below-the-fold content

**Target Sizes**:
- Initial JS: < 200KB
- Initial CSS: < 50KB
- Total initial load: < 500KB
- Each route chunk: < 100KB

### Database Query Optimization

**Principles**:
- Use indexes on frequently queried fields
- Limit result sets with pagination
- Select only needed fields
- Use database-level aggregations
- Cache expensive queries

**Example**:
```typescript
// Optimized query with select and pagination
const items = await prisma.inventoryItem.findMany({
  select: {
    id: true,
    itemName: true,
    batchNumber: true,
    quantity: true,
    createdAt: true
  },
  where: filters,
  orderBy: { createdAt: 'desc' },
  take: pageSize,
  skip: (page - 1) * pageSize
})
```


## Accessibility Implementation

### Keyboard Navigation

**Global Shortcuts**:
- Tab: Navigate through interactive elements
- Shift+Tab: Navigate backwards
- Enter/Space: Activate buttons and links
- Escape: Close modals and dropdowns
- Arrow keys: Navigate within menus and lists

**Custom Shortcuts**:
- `/` or `Ctrl+K`: Focus search
- `Ctrl+N`: New item
- `Ctrl+B`: Toggle sidebar
- `Alt+1-9`: Jump to menu items
- `?`: Show keyboard shortcuts help

**Implementation**:
```typescript
// Focus management for modals
export function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (isOpen) {
      // Save currently focused element
      const previouslyFocused = document.activeElement as HTMLElement
      
      // Focus first focusable element in modal
      const focusable = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable && focusable.length > 0) {
        (focusable[0] as HTMLElement).focus()
      }
      
      // Trap focus within modal
      const handleTab = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          // Focus trap logic
        }
      }
      
      document.addEventListener('keydown', handleTab)
      
      return () => {
        document.removeEventListener('keydown', handleTab)
        previouslyFocused?.focus() // Restore focus
      }
    }
  }, [isOpen])
  
  return isOpen ? (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {children}
    </div>
  ) : null
}
```

### Screen Reader Support

**ARIA Labels**:
```typescript
// Icon-only buttons
<button aria-label="Close menu">
  <XIcon />
</button>

// Navigation
<nav aria-label="Main navigation">
  <ul role="list">
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>

// Status indicators
<div role="status" aria-live="polite">
  {isLoading ? 'Loading...' : 'Data loaded'}
</div>
```

**Semantic HTML**:
- Use proper heading hierarchy (h1 → h2 → h3)
- Use `<nav>` for navigation
- Use `<main>` for main content
- Use `<aside>` for sidebars
- Use `<button>` for actions, `<a>` for links

**Skip Links**:
```typescript
// First element in layout
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white"
>
  Skip to main content
</a>

// Main content area
<main id="main-content" tabIndex={-1}>
  {children}
</main>
```

### Visual Accessibility

**Color Contrast**:
- Text: 4.5:1 minimum (WCAG AA)
- Large text: 3:1 minimum
- UI components: 3:1 minimum
- Test with contrast checker tools

**Focus Indicators**:
```css
/* Visible focus ring */
.focus-visible:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* Custom focus styles */
button:focus-visible {
  ring: 2px;
  ring-color: primary-500;
  ring-offset: 2px;
}
```

**Text Sizing**:
- Base font size: 16px
- Support browser zoom up to 200%
- Use relative units (rem, em)
- Avoid fixed heights that clip text


## Animation and Transitions

### Design Principles

**Duration Guidelines**:
- Micro-interactions: 100-200ms (hover, focus)
- Component transitions: 200-300ms (dropdowns, modals)
- Page transitions: 300-500ms (route changes)
- Complex animations: 500-800ms (multi-step)

**Easing Functions**:
- `ease-out`: Elements entering (fast start, slow end)
- `ease-in`: Elements exiting (slow start, fast end)
- `ease-in-out`: State changes (smooth both ends)
- `linear`: Progress indicators

**Reduced Motion**:
```css
/* Respect user preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Animation Catalog

**Sidebar Collapse/Expand**:
```css
.sidebar {
  transition: width 300ms ease-in-out;
}

.sidebar-collapsed {
  width: 72px;
}

.sidebar-expanded {
  width: 280px;
}
```

**Dropdown Slide**:
```css
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown {
  animation: slideDown 150ms ease-out;
}
```

**Modal Scale + Fade**:
```css
@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal {
  animation: modalEnter 200ms ease-out;
}
```

**Toast Slide In**:
```css
@keyframes toastSlideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.toast {
  animation: toastSlideIn 200ms ease-out;
}
```

**Page Fade**:
```css
@keyframes pageFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.page-content {
  animation: pageFade 200ms ease-in;
}
```

**Skeleton Pulse**:
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.skeleton {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```


## Internationalization (i18n)

### Translation Keys Structure

**Navigation**:
```json
{
  "navigation": {
    "dashboard": "Dashboard",
    "dataEntry": "Data Entry",
    "dataLog": "Data Log",
    "inventory": "Inventory",
    "analytics": "Analytics",
    "reports": "Reports",
    "backup": "Backup",
    "audit": "Audit",
    "settings": "Settings",
    "home": "Home"
  }
}
```

**Empty States**:
```json
{
  "emptyState": {
    "dataLog": {
      "title": "No inventory items yet",
      "description": "Start by adding your first inventory item",
      "action": "Add First Item"
    },
    "analytics": {
      "title": "Not enough data",
      "description": "Add at least 10 items to see analytics"
    },
    "audit": {
      "title": "No audit logs found",
      "action": "Reset Filters"
    },
    "backup": {
      "title": "No backups created",
      "action": "Create First Backup"
    },
    "notifications": {
      "title": "You're all caught up!",
      "description": "No new notifications"
    }
  }
}
```

**Error Messages**:
```json
{
  "errors": {
    "unauthorized": "You are not authorized to access this page",
    "forbidden": "You don't have permission to perform this action",
    "notFound": "The page you're looking for doesn't exist",
    "serverError": "Something went wrong. Please try again later",
    "networkError": "Network error. Please check your connection",
    "sessionExpired": "Your session has expired. Please log in again"
  }
}
```

### RTL Support

**Layout Adjustments**:
```typescript
// Automatic with dir="rtl" on html element
// Tailwind RTL utilities
<div className="ml-4 rtl:ml-0 rtl:mr-4">
<div className="border-l rtl:border-l-0 rtl:border-r">
<div className="rounded-l rtl:rounded-l-none rtl:rounded-r">
```

**Icon Rotation**:
```typescript
// Arrows and directional icons
<ChevronRight className="rtl:rotate-180" />
<ArrowLeft className="rtl:rotate-180" />
```

**Text Alignment**:
```typescript
<div className="text-left rtl:text-right">
<div className="text-right rtl:text-left">
```


## Security Considerations

### Authentication Flow

1. User visits protected route
2. Middleware checks session
3. If no session → redirect to login with callback URL
4. User logs in
5. Redirect back to original URL
6. Session stored in JWT cookie (httpOnly, secure)

### Authorization Checks

**Middleware Level**:
- Check user role against route permissions
- Redirect to access denied if insufficient
- Log unauthorized access attempts

**Component Level**:
```typescript
// Hide UI elements user can't access
{hasPermission(user.role, 'settings.users') && (
  <Link href="/settings/users">User Management</Link>
)}

// Disable actions user can't perform
<Button
  disabled={!hasPermission(user.role, 'inventory.delete')}
  onClick={handleDelete}
>
  Delete
</Button>
```

**API Level**:
- Verify session on every request
- Check permissions before operations
- Return 403 if unauthorized
- Log all access attempts

### CSRF Protection

- Use NextAuth built-in CSRF tokens
- Verify tokens on state-changing requests
- SameSite cookie attribute

### XSS Prevention

- React escapes by default
- Sanitize user input before storage
- Use DOMPurify for rich text
- Content Security Policy headers

### Rate Limiting

```typescript
// src/middleware/rate-limiter.ts
const rateLimiter = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimiter.get(identifier)
  
  if (!record || now > record.resetAt) {
    rateLimiter.set(identifier, { count: 1, resetAt: now + windowMs })
    return true
  }
  
  if (record.count >= limit) {
    return false
  }
  
  record.count++
  return true
}
```

### Sensitive Data Handling

- Never log passwords or tokens
- Mask sensitive data in UI
- Use environment variables for secrets
- Encrypt sensitive data at rest
- Use HTTPS in production


## Deployment and Monitoring

### Build Configuration

**Environment Variables**:
```bash
# .env.production
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<generated-secret>
DATABASE_URL=<production-db-url>
GEMINI_API_KEY=<api-key>
```

**Next.js Config**:
```javascript
// next.config.js
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: ['yourdomain.com'],
    formats: ['image/webp', 'image/avif']
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' }
        ]
      }
    ]
  }
}
```

### Monitoring Setup

**Error Tracking**:
- Sentry for error monitoring
- Log errors with context
- Alert on critical errors
- Track error trends

**Performance Monitoring**:
- Vercel Analytics for Web Vitals
- Track page load times
- Monitor API response times
- Alert on performance degradation

**User Analytics** (Optional):
- Google Analytics or Plausible
- Track page views
- Monitor user flows
- Identify drop-off points

**Uptime Monitoring**:
- Ping service every 5 minutes
- Alert on downtime
- Track uptime percentage
- Monitor response times

### Logging Strategy

**Client-Side**:
```typescript
// Development: console.log
// Production: send to logging service

export function log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console[level](message, data)
  } else {
    // Send to logging service
    // logService.log({ level, message, data, timestamp: new Date() })
  }
}
```

**Server-Side**:
```typescript
// Use Winston or Pino for structured logging
import { logger } from '@/services/logger'

logger.info('User logged in', { userId: user.id })
logger.error('Database query failed', { error, query })
```


## Implementation Phases

### Phase 1: Core Navigation Enhancement (Priority: High)

**Components**:
- Enhance Sidebar with badges and better animations
- Enhance Header with notifications bell
- Create Breadcrumbs component
- Update navigation configuration

**Deliverables**:
- Fully functional sidebar with all features
- Header with notifications dropdown
- Dynamic breadcrumbs on all pages
- Smooth animations throughout

**Estimated Effort**: 2-3 days

### Phase 2: State Management and Context (Priority: High)

**Components**:
- Create NotificationContext
- Create AppContext for global state
- Implement localStorage persistence
- Add keyboard shortcuts hook

**Deliverables**:
- Working notification system
- Global state management
- Persisted user preferences
- Keyboard navigation

**Estimated Effort**: 1-2 days

### Phase 3: Loading and Empty States (Priority: Medium)

**Components**:
- Create PageLoader component
- Create skeleton loaders for each page type
- Create EmptyState component
- Add loading states to all data fetching

**Deliverables**:
- Consistent loading indicators
- Helpful empty states
- Better user feedback

**Estimated Effort**: 1-2 days

### Phase 4: Error Handling (Priority: Medium)

**Components**:
- Enhance ErrorBoundary
- Create ErrorState component
- Create access-denied page
- Implement error logging

**Deliverables**:
- Comprehensive error handling
- User-friendly error messages
- Error tracking and logging

**Estimated Effort**: 1 day

### Phase 5: Performance Optimization (Priority: Medium)

**Tasks**:
- Implement code splitting
- Add API response caching
- Optimize bundle size
- Add performance monitoring

**Deliverables**:
- Faster page loads
- Smaller bundle sizes
- Performance metrics tracking

**Estimated Effort**: 1-2 days

### Phase 6: Accessibility and Polish (Priority: Low)

**Tasks**:
- Add keyboard shortcuts help
- Improve focus management
- Add skip links
- Accessibility audit and fixes
- Animation polish

**Deliverables**:
- WCAG AA compliant
- Full keyboard navigation
- Polished animations

**Estimated Effort**: 1-2 days

### Phase 7: Testing and Documentation (Priority: Low)

**Tasks**:
- Write unit tests
- Write integration tests
- Accessibility testing
- Performance testing
- Update documentation

**Deliverables**:
- Test coverage > 80%
- All tests passing
- Complete documentation

**Estimated Effort**: 2-3 days

## Success Metrics

### Performance Metrics

- Initial load time < 3 seconds
- Time to Interactive < 5 seconds
- Lighthouse score > 90
- Bundle size < 500KB
- No layout shifts (CLS < 0.1)

### User Experience Metrics

- Navigation success rate > 95%
- Error rate < 1%
- User satisfaction score > 4/5
- Task completion time reduced by 20%

### Accessibility Metrics

- WCAG AA compliance: 100%
- Keyboard navigation: All features accessible
- Screen reader compatibility: Full support
- Color contrast: All elements pass

### Code Quality Metrics

- Test coverage > 80%
- TypeScript strict mode: Enabled
- ESLint errors: 0
- Build warnings: 0

## Future Enhancements

### Short Term (1-3 months)

- Global search functionality
- Command palette (Cmd+K)
- Recent pages history
- Favorites/bookmarks
- User onboarding tour

### Medium Term (3-6 months)

- Real-time collaboration indicators
- Advanced notifications (push, email)
- Customizable dashboard
- Saved filters and views
- Export/import preferences

### Long Term (6-12 months)

- Mobile app (React Native)
- Offline mode with sync
- Advanced analytics dashboard
- API for third-party integrations
- Plugin system for extensions

## Conclusion

This design provides a comprehensive blueprint for integrating all application pages with professional navigation, routing, and user experience enhancements. The phased approach allows for incremental development while maintaining a working application throughout the process. The focus on performance, accessibility, and user experience ensures a high-quality product that meets modern web standards.
