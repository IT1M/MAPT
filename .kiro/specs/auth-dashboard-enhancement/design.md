# Design Document

## Overview

This design document outlines the technical architecture and implementation approach for enhancing the Saudi Mais Medical Products Inventory System with professional authentication, advanced security features, role-based dashboards, and comprehensive integrations. The enhancement builds upon the existing Next.js 14 application with NextAuth.js, Prisma ORM, and PostgreSQL database.

### Goals

- Create a professional, secure authentication experience with modern UI/UX
- Implement comprehensive session management across multiple devices
- Build role-specific dashboards with personalized content
- Integrate email notifications for critical events
- Add real-time in-app notifications
- Implement global search across all entities
- Provide advanced export capabilities
- Enable keyboard shortcuts for power users
- Support theme customization and accessibility
- Track user activities and system analytics
- Enable PWA capabilities for offline support

### Non-Goals

- Native mobile applications (PWA only in this phase)
- Third-party SSO integration (future enhancement)
- Blockchain audit trail (future consideration)
- IoT device integration (future phase)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (Browser)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Pages   │  │  Dashboards  │  │  Components  │      │
│  │ - Login      │  │  - Admin     │  │  - Search    │      │
│  │ - Register   │  │  - Manager   │  │  - Notif     │      │
│  │ - Reset PW   │  │  - Supervisor│  │  - Export    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 14 App Router                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Middleware Layer                        │   │
│  │  - Auth Check  - Rate Limiting  - CSRF Protection   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Routes Layer                        │   │
│  │  /api/auth/*  /api/notifications/*  /api/search/*   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Auth    │  │  Email   │  │  Search  │  │ Activity │   │
│  │ Service  │  │ Service  │  │ Service  │  │ Tracking │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Prisma ORM                              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                     │   │
│  │  - Users  - Sessions  - AuditLogs  - Notifications  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React 18, Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Database**: PostgreSQL with Prisma ORM
- **Email**: Nodemailer with SMTP or Resend API
- **State Management**: React Context + Hooks
- **Form Validation**: Zod
- **Real-time**: Server-Sent Events (SSE) or polling
- **PWA**: next-pwa plugin with Workbox
- **Testing**: Vitest, React Testing Library


## Components and Interfaces

### 1. Authentication System

#### Enhanced Login Page Component

**Location**: `/src/app/[locale]/login/page.tsx`

**Structure**:
```typescript
interface LoginPageProps {
  searchParams: { callbackUrl?: string; error?: string }
}

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}
```

**Features**:
- Two-column responsive layout (branding + form)
- Real-time validation with Zod
- Rate limiting (5 attempts per 15 minutes)
- Remember me functionality (30-day session)
- CAPTCHA after 5 failed attempts
- Animated error states
- Keyboard shortcuts (Enter to submit)

**UI Components**:
- `BrandingPanel`: Left side with logo, gradient, features
- `LoginForm`: Right side with form fields
- `PasswordInput`: With show/hide toggle
- `RememberMeCheckbox`: With tooltip
- `ForgotPasswordLink`: Opens recovery flow

#### Registration Page Component

**Location**: `/src/app/[locale]/register/page.tsx`

**Structure**:
```typescript
interface RegisterFormData {
  name: string
  email: string
  phone?: string
  password: string
  confirmPassword: string
  department?: string
  acceptTerms: boolean
}

interface PasswordRequirements {
  minLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSpecial: boolean
}
```

**Features**:
- Password strength meter (weak/medium/strong)
- Real-time requirements checklist
- Async email uniqueness validation
- Terms & conditions modal
- Auto-login after registration
- Welcome email trigger

#### Password Recovery Flow

**Components**:
- `ForgotPasswordPage`: Email input form
- `ResetPasswordPage`: New password form with token validation
- `PasswordResetSuccess`: Confirmation with auto-redirect

**Token Management**:
```typescript
interface PasswordResetToken {
  token: string
  userId: string
  expiresAt: Date
  used: boolean
}
```

**Flow**:
1. User requests reset → Generate UUID token
2. Store token in database with 60-minute expiry
3. Send email with reset link
4. Validate token on reset page
5. Update password and invalidate token
6. Invalidate all existing sessions
7. Send confirmation email

### 2. Session Management System

#### Session Model Extension

**Prisma Schema Addition**:
```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  deviceType   String?  // Desktop, Mobile, Tablet
  browser      String?  // Chrome, Firefox, Safari
  os           String?  // Windows, macOS, iOS, Android
  ipAddress    String?
  location     String?  // City, Country
  userAgent    String?
  lastActive   DateTime @default(now())
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([sessionToken])
  @@map("sessions")
}
```

#### Session Manager Component

**Location**: `/src/components/settings/SessionManager.tsx`

**Features**:
- Display all active sessions in table
- Device/browser/OS detection from user agent
- IP geolocation for location display
- "Current device" badge
- Individual session termination
- "Sign out all other devices" action
- Real-time session updates

**API Endpoints**:
- `GET /api/auth/sessions` - List user's sessions
- `DELETE /api/auth/sessions/[id]` - Terminate specific session
- `DELETE /api/auth/sessions/all` - Terminate all except current

#### Security Notifications

**Trigger**: New device/location login detection

**Logic**:
```typescript
async function detectSuspiciousLogin(
  userId: string,
  newSession: SessionData
): Promise<boolean> {
  const recentSessions = await getRecentSessions(userId, 24); // Last 24 hours
  
  // Check for new device
  const isNewDevice = !recentSessions.some(s => 
    s.deviceType === newSession.deviceType &&
    s.browser === newSession.browser
  );
  
  // Check for distant location
  const hasDistantLocation = recentSessions.some(s => 
    calculateDistance(s.location, newSession.location) > 500 // km
  );
  
  return isNewDevice || hasDistantLocation;
}
```

### 3. Role-Based Dashboard System

#### Dashboard Router

**Location**: `/src/app/[locale]/page.tsx` (root after login)

**Redirect Logic**:
```typescript
const ROLE_DASHBOARDS: Record<UserRole, string> = {
  ADMIN: '/dashboard',
  MANAGER: '/analytics',
  SUPERVISOR: '/data-log',
  DATA_ENTRY: '/data-entry',
  AUDITOR: '/audit'
}

function getDashboardPath(role: UserRole, callbackUrl?: string): string {
  return callbackUrl || ROLE_DASHBOARDS[role] || '/dashboard'
}
```

#### Dashboard Components

**Admin Dashboard** (`/src/app/[locale]/dashboard/page.tsx`):
```typescript
interface AdminDashboardData {
  systemHealth: {
    database: 'connected' | 'disconnected'
    geminiAI: 'active' | 'inactive'
    lastBackup: Date
    storageUsed: number
    activeUsers: number
  }
  recentActivity: ActivityEvent[]
  userActivity: UserActivitySummary[]
  alerts: SystemAlert[]
  statistics: SystemStatistics
}
```

**Components**:
- `SystemHealthWidget`: Status indicators
- `QuickActionsPanel`: Create user, backup, reports
- `ActivityTimeline`: Live feed of system events
- `UserActivityChart`: Bar chart of active users
- `AlertsPanel`: Critical notifications
- `SystemStatisticsCards`: KPI metrics

**Manager Dashboard** (`/src/app/[locale]/analytics/page.tsx`):
- `ExecutiveSummaryCards`: Total items, revenue impact, reject rate
- `AnalyticsOverview`: Charts and trends
- `AIInsightsPanel`: Gemini-generated insights
- `ReportsCenter`: Recent and scheduled reports
- `TeamPerformance`: User statistics

**Supervisor Dashboard** (`/src/app/[locale]/data-log/page.tsx`):
- `ItemsRequiringReview`: Flagged items table
- `TeamActivityMonitor`: Real-time team feed
- `QualityControlDashboard`: Reject rate metrics
- `RecentEntriesTable`: Last 50 items
- `AuditHighlights`: Recent changes

**Data Entry Dashboard** (`/src/app/[locale]/data-entry/page.tsx`):
- `AddNewItemCard`: Prominent CTA
- `TodaysEntries`: User's items today
- `PersonalStats`: Individual metrics
- `RecentBatches`: Quick reference
- `TipsWidget`: Best practices

**Auditor Dashboard** (`/src/app/[locale]/audit/page.tsx`):
- `AdvancedSearchBar`: Audit log search
- `AuditOverview`: Summary cards
- `AuditLogTable`: Detailed entries
- `ActivityHeatmap`: Visual patterns
- `UserBehaviorAnalysis`: Anomaly detection

#### Dashboard Personalization

**Greeting Component**:
```typescript
function getGreeting(hour: number): string {
  if (hour >= 6 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 18) return 'Good afternoon'
  if (hour >= 18 && hour < 24) return 'Good evening'
  return 'Good night'
}

function DashboardGreeting({ user }: { user: User }) {
  const hour = new Date().getHours()
  const greeting = getGreeting(hour)
  
  return (
    <div>
      <h1>{greeting}, {user.name}!</h1>
      <p>Last login: {formatRelativeTime(user.lastLogin)}</p>
    </div>
  )
}
```

### 4. Email Notification System

#### Email Service

**Location**: `/src/services/email.ts`

**Configuration**:
```typescript
interface EmailConfig {
  provider: 'smtp' | 'resend'
  smtp?: {
    host: string
    port: number
    secure: boolean
    auth: { user: string; pass: string }
  }
  resend?: {
    apiKey: string
  }
  from: {
    name: string
    email: string
  }
}

interface EmailTemplate {
  name: string
  subject: string
  html: string
  text: string
}
```

**Email Templates**:

1. **Welcome Email** (`/src/emails/templates/welcome.html`):
   - Subject: "Welcome to Saudi Mais Inventory System"
   - Content: Credentials, first login link, help resources
   - CTA: "Get Started" button

2. **Password Reset** (`/src/emails/templates/password-reset.html`):
   - Subject: "Reset Your Password"
   - Content: Reset link (expires in 60 minutes)
   - Warning: "If you didn't request this..."
   - CTA: "Reset Password" button

3. **Security Alert** (`/src/emails/templates/security-alert.html`):
   - Subject: "New Login Detected"
   - Content: Device, location, time details
   - CTAs: "Yes, that was me" / "No, secure my account"

4. **Daily Summary** (`/src/emails/templates/daily-summary.html`):
   - Subject: "Your Daily Inventory Summary"
   - Content: Yesterday's stats, top items, alerts
   - CTA: "View Dashboard"

5. **High Reject Rate Alert** (`/src/emails/templates/high-reject-alert.html`):
   - Subject: "⚠️ High Reject Rate Detected"
   - Content: Reject rate percentage, affected items
   - CTA: "Investigate Now"

**Email Queue System**:
```typescript
interface EmailJob {
  id: string
  to: string
  template: string
  data: Record<string, any>
  scheduledFor: Date
  attempts: number
  status: 'pending' | 'sent' | 'failed'
}

// Simple in-memory queue (upgrade to Bull/BullMQ for production)
class EmailQueue {
  private queue: EmailJob[] = []
  
  async add(job: Omit<EmailJob, 'id' | 'attempts' | 'status'>): Promise<void>
  async process(): Promise<void>
  async retry(jobId: string): Promise<void>
}
```

### 5. In-App Notification System

#### Notification Model

**Prisma Schema**:
```prisma
model Notification {
  id          String            @id @default(cuid())
  userId      String
  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  type        NotificationType
  title       String
  message     String            @db.Text
  link        String?
  read        Boolean           @default(false)
  readAt      DateTime?
  priority    NotificationPriority @default(NORMAL)
  metadata    Json?
  createdAt   DateTime          @default(now())
  expiresAt   DateTime?
  
  @@index([userId, read])
  @@index([createdAt])
  @@map("notifications")
}

enum NotificationType {
  SYSTEM
  ACTIVITY
  APPROVAL
  ALERT
  MENTION
}

enum NotificationPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

#### Notification Center Component

**Location**: `/src/components/layout/NotificationCenter.tsx`

**Features**:
- Bell icon with unread badge
- Dropdown panel (max 20 recent)
- Tabs: All, Unread, Mentions
- Real-time updates via polling (30s interval)
- Mark as read on click
- "Mark all as read" action
- Link to full notifications page

**API Endpoints**:
- `GET /api/notifications` - List notifications (paginated)
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/[id]/read` - Mark as read
- `PATCH /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/[id]` - Delete notification

**Real-Time Updates**:
```typescript
// Polling approach (simple, works everywhere)
function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  
  useEffect(() => {
    const fetchNotifications = async () => {
      const data = await fetch('/api/notifications/unread-count')
      const { count } = await data.json()
      setUnreadCount(count)
    }
    
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // 30s
    
    return () => clearInterval(interval)
  }, [])
  
  return { notifications, unreadCount }
}
```

### 6. Global Search System

#### Search Service

**Location**: `/src/services/search.ts`

**Search Interface**:
```typescript
interface SearchQuery {
  query: string
  filters?: {
    categories?: string[]
    dateRange?: { from: Date; to: Date }
    users?: string[]
  }
  limit?: number
}

interface SearchResult {
  items: SearchResultItem[]
  reports: SearchResultItem[]
  users: SearchResultItem[]
  settings: SearchResultItem[]
  total: number
}

interface SearchResultItem {
  id: string
  type: 'item' | 'report' | 'user' | 'setting'
  title: string
  description: string
  url: string
  metadata?: Record<string, any>
}
```

**Search Implementation**:
```typescript
async function globalSearch(
  query: string,
  userId: string,
  userRole: UserRole
): Promise<SearchResult> {
  const searchTerm = query.toLowerCase()
  
  // Search inventory items
  const items = await prisma.inventoryItem.findMany({
    where: {
      OR: [
        { itemName: { contains: searchTerm, mode: 'insensitive' } },
        { batch: { contains: searchTerm, mode: 'insensitive' } },
        { category: { contains: searchTerm, mode: 'insensitive' } }
      ]
    },
    take: 5,
    select: { id: true, itemName: true, batch: true, category: true }
  })
  
  // Search reports (if user has access)
  const reports = userRole !== 'DATA_ENTRY' ? await prisma.report.findMany({
    where: {
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } }
      ]
    },
    take: 3
  }) : []
  
  // Search users (admin only)
  const users = userRole === 'ADMIN' ? await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } }
      ]
    },
    take: 3
  }) : []
  
  return {
    items: items.map(i => ({
      id: i.id,
      type: 'item',
      title: i.itemName,
      description: `Batch: ${i.batch} | Category: ${i.category}`,
      url: `/inventory/${i.id}`
    })),
    reports,
    users,
    settings: [], // Search settings based on keys
    total: items.length + reports.length + users.length
  }
}
```

#### Global Search Component

**Location**: `/src/components/search/GlobalSearch.tsx`

**Features**:
- Modal overlay with backdrop
- Large search input with autofocus
- Results grouped by category
- Keyboard navigation (arrows, enter, escape)
- Recent searches (localStorage)
- Debounced search (300ms)
- Loading states
- Empty state with suggestions

**Keyboard Shortcut**:
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      setIsOpen(true)
    }
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }
  
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```


### 7. Export System

#### Universal Export Service

**Location**: `/src/services/export.ts`

**Export Interface**:
```typescript
interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json'
  data: any[]
  columns?: string[]
  filename?: string
  includeFilters?: boolean
  metadata?: {
    title?: string
    generatedBy?: string
    dateRange?: string
  }
}

interface ExportResult {
  success: boolean
  filename: string
  fileSize: number
  downloadUrl?: string
  error?: string
}
```

**Export Implementations**:

1. **CSV Export**:
```typescript
import { stringify } from 'csv-stringify/sync'

async function exportToCSV(options: ExportOptions): Promise<Buffer> {
  const csv = stringify(options.data, {
    header: true,
    columns: options.columns
  })
  return Buffer.from(csv, 'utf-8')
}
```

2. **Excel Export**:
```typescript
import * as XLSX from 'xlsx'

async function exportToExcel(options: ExportOptions): Promise<Buffer> {
  const worksheet = XLSX.utils.json_to_sheet(options.data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
  
  // Add formatting
  worksheet['!cols'] = options.columns?.map(() => ({ wch: 15 }))
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}
```

3. **PDF Export**:
```typescript
import PDFDocument from 'pdfkit'

async function exportToPDF(options: ExportOptions): Promise<Buffer> {
  const doc = new PDFDocument()
  const chunks: Buffer[] = []
  
  doc.on('data', chunk => chunks.push(chunk))
  
  // Add title
  doc.fontSize(20).text(options.metadata?.title || 'Export', { align: 'center' })
  doc.moveDown()
  
  // Add table
  // ... table rendering logic
  
  doc.end()
  
  return Buffer.concat(chunks)
}
```

#### Export Component

**Location**: `/src/components/export/UniversalExport.tsx`

**Features**:
- Format selection (radio buttons)
- Column selection (checkboxes)
- Filename customization
- Progress indicator for large exports
- Auto-download on completion
- Email option for large exports (>5000 records)

### 8. Keyboard Shortcuts System

#### Shortcut Manager Hook

**Location**: `/src/hooks/useKeyboardShortcuts.ts`

**Implementation**:
```typescript
interface Shortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
  category: string
}

function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find(s => 
        s.key === e.key &&
        (s.ctrl === undefined || s.ctrl === (e.ctrlKey || e.metaKey)) &&
        (s.shift === undefined || s.shift === e.shiftKey) &&
        (s.alt === undefined || s.alt === e.altKey)
      )
      
      if (matchingShortcut) {
        e.preventDefault()
        matchingShortcut.action()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}
```

**Global Shortcuts**:
```typescript
const GLOBAL_SHORTCUTS: Shortcut[] = [
  {
    key: 'k',
    ctrl: true,
    action: () => openGlobalSearch(),
    description: 'Open global search',
    category: 'Navigation'
  },
  {
    key: '/',
    ctrl: true,
    action: () => openShortcutsHelp(),
    description: 'Show keyboard shortcuts',
    category: 'Help'
  },
  {
    key: 'n',
    ctrl: true,
    action: () => router.push('/data-entry'),
    description: 'New item',
    category: 'Actions'
  },
  {
    key: 'Escape',
    action: () => closeModal(),
    description: 'Close modal',
    category: 'Navigation'
  }
]
```

#### Shortcuts Help Modal

**Component**: `/src/components/help/ShortcutsModal.tsx`

**Features**:
- Grouped by category
- Visual keyboard representation
- Search shortcuts
- Print option
- Platform-specific display (Ctrl vs Cmd)

### 9. Theme Customization System

#### Theme Configuration

**Location**: `/src/config/themes.ts`

**Theme Interface**:
```typescript
interface Theme {
  id: string
  name: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
    border: string
  }
  fonts: {
    family: string
    size: {
      base: string
      sm: string
      lg: string
    }
  }
  spacing: {
    density: 'compact' | 'comfortable' | 'spacious'
  }
  animations: {
    enabled: boolean
    speed: 'slow' | 'normal' | 'fast'
  }
}

const PRESET_THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Medical Blue',
    colors: {
      primary: '#0d9488',
      secondary: '#06b6d4',
      // ...
    }
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      primary: '#0ea5e9',
      // ...
    }
  }
  // ... more presets
]
```

#### Theme Customizer Component

**Location**: `/src/components/settings/ThemeCustomizer.tsx`

**Features**:
- Preset theme selection
- Custom color pickers for primary/accent
- Font family dropdown
- Font size slider
- Layout density selector
- Animation toggle and speed
- Live preview
- Save custom theme
- Export/import theme JSON

**Theme Application**:
```typescript
function applyTheme(theme: Theme) {
  const root = document.documentElement
  
  // Apply CSS variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value)
  })
  
  root.style.setProperty('--font-family', theme.fonts.family)
  root.style.setProperty('--font-size-base', theme.fonts.size.base)
  
  // Apply density class
  root.classList.remove('density-compact', 'density-comfortable', 'density-spacious')
  root.classList.add(`density-${theme.spacing.density}`)
  
  // Save to localStorage
  localStorage.setItem('theme', JSON.stringify(theme))
}
```

### 10. Activity Tracking System

#### Activity Tracking Service

**Location**: `/src/services/analytics.ts`

**Event Tracking**:
```typescript
interface ActivityEvent {
  userId: string
  event: string
  metadata: Record<string, any>
  timestamp: Date
  ipAddress: string
  userAgent: string
  sessionId: string
}

const TRACKED_EVENTS = {
  PAGE_VIEW: 'page_view',
  ITEM_ADDED: 'item_added',
  ITEM_EDITED: 'item_edited',
  ITEM_DELETED: 'item_deleted',
  REPORT_GENERATED: 'report_generated',
  EXPORT_DATA: 'export_data',
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
  LOGIN: 'login',
  LOGOUT: 'logout'
}

async function trackEvent(
  userId: string,
  event: string,
  metadata: Record<string, any>,
  request: NextRequest
): Promise<void> {
  await prisma.activityLog.create({
    data: {
      userId,
      event,
      metadata,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      sessionId: request.cookies.get('session-id')?.value || 'unknown',
      timestamp: new Date()
    }
  })
}
```

#### Activity Analytics Dashboard

**Component**: `/src/components/analytics/ActivityDashboard.tsx`

**Metrics**:
- Active users (last 24h, 7d, 30d)
- Most used features
- Average session duration
- Peak usage times (heatmap)
- Feature adoption rates
- User journey flows

**Visualizations**:
- Line chart: Daily active users
- Bar chart: Feature usage
- Heatmap: Activity by hour/day
- Funnel: User journey
- Table: Top users by activity

### 11. Bulk Operations System

#### Bulk Actions Component

**Location**: `/src/components/tables/BulkActionsToolbar.tsx`

**Features**:
- Appears when items selected
- Shows selected count
- Available actions based on permissions
- Progress indicator during operations
- Success/error summary

**Bulk Edit Modal**:
```typescript
interface BulkEditOptions {
  selectedIds: string[]
  fields: {
    destination?: Destination
    category?: string
    notes?: string
  }
  mode: 'append' | 'replace' // For notes field
}

async function bulkEdit(options: BulkEditOptions): Promise<BulkEditResult> {
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[]
  }
  
  for (const id of options.selectedIds) {
    try {
      await prisma.inventoryItem.update({
        where: { id },
        data: options.fields
      })
      results.successful++
    } catch (error) {
      results.failed++
      results.errors.push(`Failed to update item ${id}: ${error.message}`)
    }
  }
  
  return results
}
```

### 12. Advanced Filtering System

#### Filter Builder Component

**Location**: `/src/components/filters/FilterBuilder.tsx`

**Filter Structure**:
```typescript
interface Filter {
  id: string
  field: string
  operator: FilterOperator
  value: any
  logic?: 'AND' | 'OR'
}

type FilterOperator = 
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with'
  | 'greater_than' | 'less_than' | 'between'
  | 'is_null' | 'is_not_null'
  | 'in' | 'not_in'

interface FilterGroup {
  filters: Filter[]
  logic: 'AND' | 'OR'
}
```

**Filter Application**:
```typescript
function buildPrismaWhere(filterGroup: FilterGroup): any {
  const conditions = filterGroup.filters.map(filter => {
    switch (filter.operator) {
      case 'equals':
        return { [filter.field]: filter.value }
      case 'contains':
        return { [filter.field]: { contains: filter.value, mode: 'insensitive' } }
      case 'greater_than':
        return { [filter.field]: { gt: filter.value } }
      case 'between':
        return { [filter.field]: { gte: filter.value[0], lte: filter.value[1] } }
      // ... more operators
    }
  })
  
  return filterGroup.logic === 'AND' 
    ? { AND: conditions }
    : { OR: conditions }
}
```

**Saved Filters**:
```prisma
model SavedFilter {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  name      String
  filters   Json
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())
  
  @@map("saved_filters")
}
```

### 13. Data Import System

#### Import Wizard Component

**Location**: `/src/components/import/ImportWizard.tsx`

**Steps**:
1. File Upload
2. Column Mapping
3. Data Validation
4. Import Options
5. Review & Confirm
6. Import Progress

**Validation Logic**:
```typescript
interface ValidationError {
  row: number
  field: string
  value: any
  error: string
  suggestion?: string
}

async function validateImportData(
  data: any[],
  mapping: ColumnMapping
): Promise<ValidationError[]> {
  const errors: ValidationError[] = []
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    
    // Validate required fields
    if (!row[mapping.itemName]) {
      errors.push({
        row: i + 1,
        field: 'itemName',
        value: row[mapping.itemName],
        error: 'Item name is required'
      })
    }
    
    // Validate data types
    if (isNaN(Number(row[mapping.quantity]))) {
      errors.push({
        row: i + 1,
        field: 'quantity',
        value: row[mapping.quantity],
        error: 'Quantity must be a number',
        suggestion: 'Remove non-numeric characters'
      })
    }
    
    // Validate enums
    if (row[mapping.destination] && 
        !['MAIS', 'FOZAN'].includes(row[mapping.destination])) {
      errors.push({
        row: i + 1,
        field: 'destination',
        value: row[mapping.destination],
        error: 'Invalid destination',
        suggestion: 'Must be MAIS or FOZAN'
      })
    }
  }
  
  return errors
}
```

### 14. Help Center System

#### Help Center Structure

**Location**: `/src/app/[locale]/help/page.tsx`

**Content Management**:
```typescript
interface HelpArticle {
  id: string
  title: string
  slug: string
  category: string
  content: string // Markdown
  tags: string[]
  views: number
  helpful: number
  notHelpful: number
  lastUpdated: Date
}

interface HelpCategory {
  id: string
  name: string
  icon: string
  articles: HelpArticle[]
}
```

**Search Implementation**:
```typescript
async function searchHelpArticles(query: string): Promise<HelpArticle[]> {
  // Full-text search on title, content, tags
  const articles = await prisma.helpArticle.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { tags: { has: query.toLowerCase() } }
      ]
    },
    orderBy: [
      { views: 'desc' },
      { helpful: 'desc' }
    ]
  })
  
  return articles
}
```

**Article Component**:
- Markdown rendering with syntax highlighting
- Table of contents for long articles
- Related articles
- Feedback buttons (helpful/not helpful)
- Print button
- Share link

### 15. Progressive Web App (PWA)

#### PWA Configuration

**Manifest**: `/public/manifest.json`
```json
{
  "name": "Saudi Mais Inventory System",
  "short_name": "Mais Inventory",
  "description": "Medical inventory management with AI insights",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0d9488",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**Service Worker**: `/public/sw.js`
```javascript
const CACHE_NAME = 'mais-inventory-v1'
const STATIC_ASSETS = [
  '/',
  '/login',
  '/dashboard',
  '/offline'
]

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline')
        }
      })
    })
  )
})

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-items') {
    event.waitUntil(syncPendingItems())
  }
})
```

**Offline Queue**:
```typescript
interface OfflineAction {
  id: string
  type: 'create' | 'update' | 'delete'
  entity: string
  data: any
  timestamp: Date
  synced: boolean
}

class OfflineQueue {
  private queue: OfflineAction[] = []
  
  add(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced'>): void {
    const offlineAction: OfflineAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      synced: false
    }
    
    this.queue.push(offlineAction)
    localStorage.setItem('offline-queue', JSON.stringify(this.queue))
  }
  
  async sync(): Promise<void> {
    const pending = this.queue.filter(a => !a.synced)
    
    for (const action of pending) {
      try {
        await this.syncAction(action)
        action.synced = true
      } catch (error) {
        console.error('Failed to sync action:', error)
      }
    }
    
    this.queue = this.queue.filter(a => !a.synced)
    localStorage.setItem('offline-queue', JSON.stringify(this.queue))
  }
  
  private async syncAction(action: OfflineAction): Promise<void> {
    const endpoint = `/api/${action.entity}`
    const method = action.type === 'create' ? 'POST' : 
                   action.type === 'update' ? 'PATCH' : 'DELETE'
    
    await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action.data)
    })
  }
}
```


### 16. Security Enhancements

#### Two-Factor Authentication (2FA)

**Model**:
```prisma
model TwoFactorAuth {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  secret    String   // Encrypted TOTP secret
  enabled   Boolean  @default(false)
  backupCodes String[] // Hashed backup codes
  createdAt DateTime @default(now())
  
  @@map("two_factor_auth")
}
```

**Setup Flow**:
1. User enables 2FA in settings
2. Generate TOTP secret using `speakeasy` library
3. Display QR code using `qrcode` library
4. User scans with authenticator app
5. User enters verification code
6. Generate 10 backup codes
7. User confirms they've saved backup codes
8. Enable 2FA

**Login Flow with 2FA**:
```typescript
async function loginWith2FA(
  email: string,
  password: string,
  totpCode?: string
): Promise<LoginResult> {
  // Step 1: Verify credentials
  const user = await verifyCredentials(email, password)
  if (!user) {
    return { success: false, error: 'Invalid credentials' }
  }
  
  // Step 2: Check if 2FA is enabled
  const twoFactor = await prisma.twoFactorAuth.findUnique({
    where: { userId: user.id }
  })
  
  if (twoFactor?.enabled) {
    if (!totpCode) {
      return { success: false, requires2FA: true }
    }
    
    // Step 3: Verify TOTP code
    const isValid = speakeasy.totp.verify({
      secret: decrypt(twoFactor.secret),
      encoding: 'base32',
      token: totpCode,
      window: 1 // Allow 30s time drift
    })
    
    if (!isValid) {
      // Check backup codes
      const isBackupCode = await verifyBackupCode(user.id, totpCode)
      if (!isBackupCode) {
        return { success: false, error: 'Invalid 2FA code' }
      }
    }
  }
  
  // Step 4: Create session
  return { success: true, user }
}
```

#### Rate Limiting

**Implementation**: `/src/middleware/rate-limiter.ts`

```typescript
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message: string
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many requests. Please slow down.'
  },
  export: {
    windowMs: 60 * 1000,
    maxRequests: 5,
    message: 'Too many export requests. Please wait a minute.'
  }
}

class RateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>()
  
  check(key: string, config: RateLimitConfig): boolean {
    const now = Date.now()
    const record = this.store.get(key)
    
    if (!record || now > record.resetAt) {
      this.store.set(key, {
        count: 1,
        resetAt: now + config.windowMs
      })
      return true
    }
    
    if (record.count >= config.maxRequests) {
      return false
    }
    
    record.count++
    return true
  }
  
  reset(key: string): void {
    this.store.delete(key)
  }
}
```

#### Account Lockout

**Logic**:
```typescript
async function handleFailedLogin(email: string): Promise<void> {
  const key = `failed-login:${email}`
  const attempts = await redis.incr(key)
  
  if (attempts === 1) {
    await redis.expire(key, 15 * 60) // 15 minutes
  }
  
  if (attempts >= 5) {
    // Show CAPTCHA
    await redis.set(`require-captcha:${email}`, '1', 'EX', 15 * 60)
  }
  
  if (attempts >= 10) {
    // Lock account
    await prisma.user.update({
      where: { email },
      data: { 
        isActive: false,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000)
      }
    })
    
    // Send alert email
    await sendSecurityAlert(email, 'Account locked due to multiple failed login attempts')
  }
}
```

#### Security Score Calculation

**Component**: `/src/components/settings/SecurityScore.tsx`

```typescript
interface SecurityScoreFactors {
  passwordStrength: number // 0-30
  twoFactorEnabled: number // 0-25
  activeSessions: number // 0-15
  recentSecurityEvents: number // 0-15
  lastPasswordChange: number // 0-15
}

function calculateSecurityScore(user: User): SecurityScoreFactors {
  const score: SecurityScoreFactors = {
    passwordStrength: 0,
    twoFactorEnabled: 0,
    activeSessions: 0,
    recentSecurityEvents: 0,
    lastPasswordChange: 0
  }
  
  // Password strength (30 points)
  const passwordAge = Date.now() - user.passwordChangedAt.getTime()
  const hasStrongPassword = user.passwordHash.length > 60 // bcrypt hash length
  score.passwordStrength = hasStrongPassword ? 30 : 15
  
  // 2FA (25 points)
  score.twoFactorEnabled = user.twoFactorEnabled ? 25 : 0
  
  // Active sessions (15 points)
  const sessionCount = user.sessions.length
  if (sessionCount <= 2) score.activeSessions = 15
  else if (sessionCount <= 5) score.activeSessions = 10
  else score.activeSessions = 5
  
  // Recent security events (15 points)
  const recentFailedLogins = user.auditLogs.filter(
    log => log.action === 'LOGIN' && 
           log.metadata.success === false &&
           Date.now() - log.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
  ).length
  score.recentSecurityEvents = recentFailedLogins === 0 ? 15 : 0
  
  // Last password change (15 points)
  const daysSinceChange = passwordAge / (24 * 60 * 60 * 1000)
  if (daysSinceChange < 90) score.lastPasswordChange = 15
  else if (daysSinceChange < 180) score.lastPasswordChange = 10
  else score.lastPasswordChange = 0
  
  return score
}

function getTotalScore(factors: SecurityScoreFactors): number {
  return Object.values(factors).reduce((sum, val) => sum + val, 0)
}
```

## Data Models

### New Database Models

```prisma
// Add to existing schema.prisma

model Notification {
  id          String            @id @default(cuid())
  userId      String
  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  type        NotificationType
  title       String
  message     String            @db.Text
  link        String?
  read        Boolean           @default(false)
  readAt      DateTime?
  priority    NotificationPriority @default(NORMAL)
  metadata    Json?
  createdAt   DateTime          @default(now())
  expiresAt   DateTime?
  
  @@index([userId, read])
  @@index([createdAt])
  @@map("notifications")
}

enum NotificationType {
  SYSTEM
  ACTIVITY
  APPROVAL
  ALERT
  MENTION
}

enum NotificationPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  used      Boolean  @default(false)
  usedAt    DateTime?
  createdAt DateTime @default(now())
  
  @@index([token])
  @@index([userId])
  @@map("password_reset_tokens")
}

model TwoFactorAuth {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  secret      String   // Encrypted TOTP secret
  enabled     Boolean  @default(false)
  backupCodes String[] // Hashed backup codes
  createdAt   DateTime @default(now())
  
  @@map("two_factor_auth")
}

model SavedFilter {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  entity    String   // 'inventory', 'audit', 'reports'
  filters   Json
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId, entity])
  @@map("saved_filters")
}

model ActivityLog {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  event      String
  metadata   Json?
  ipAddress  String
  userAgent  String
  sessionId  String
  timestamp  DateTime @default(now())
  
  @@index([userId])
  @@index([event])
  @@index([timestamp])
  @@map("activity_logs")
}

model HelpArticle {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  category    String
  content     String   @db.Text
  tags        String[]
  views       Int      @default(0)
  helpful     Int      @default(0)
  notHelpful  Int      @default(0)
  published   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([category])
  @@index([slug])
  @@map("help_articles")
}

model EmailLog {
  id        String   @id @default(cuid())
  to        String
  template  String
  subject   String
  status    EmailStatus
  sentAt    DateTime?
  error     String?
  attempts  Int      @default(0)
  createdAt DateTime @default(now())
  
  @@index([to])
  @@index([status])
  @@index([createdAt])
  @@map("email_logs")
}

enum EmailStatus {
  PENDING
  SENT
  FAILED
  BOUNCED
}

// Update existing User model
model User {
  // ... existing fields
  
  // Add new relations
  notifications       Notification[]
  passwordResetTokens PasswordResetToken[]
  twoFactorAuth       TwoFactorAuth?
  savedFilters        SavedFilter[]
  activityLogs        ActivityLog[]
  
  // Add new fields
  lastLogin           DateTime?
  lastLoginIp         String?
  passwordChangedAt   DateTime @default(now())
  lockedUntil         DateTime?
  emailVerified       Boolean  @default(false)
  emailVerifiedAt     DateTime?
}

// Update existing Session model
model Session {
  // ... existing fields
  
  // Add new fields
  deviceType   String?
  browser      String?
  os           String?
  ipAddress    String?
  location     String?
  userAgent    String?
  lastActive   DateTime @default(now())
  createdAt    DateTime @default(now())
}
```

## Error Handling

### Error Types

```typescript
class AuthenticationError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

class RateLimitError extends Error {
  constructor(message: string, public retryAfter: number) {
    super(message)
    this.name = 'RateLimitError'
  }
}

class ValidationError extends Error {
  constructor(message: string, public fields: Record<string, string>) {
    super(message)
    this.name = 'ValidationError'
  }
}
```

### Error Handling Strategy

1. **Client-Side Errors**:
   - Display inline validation errors
   - Show toast notifications for API errors
   - Provide retry mechanisms
   - Log errors to console in development

2. **Server-Side Errors**:
   - Log all errors with context
   - Return appropriate HTTP status codes
   - Sanitize error messages for security
   - Track error rates in monitoring

3. **Network Errors**:
   - Implement retry logic with exponential backoff
   - Queue actions for offline sync
   - Display offline banner
   - Provide manual retry option

## Testing Strategy

### Unit Tests

**Test Coverage Goals**: >80%

**Key Areas**:
- Validation schemas (Zod)
- Utility functions (formatters, validators)
- Service layer logic
- React hooks
- Component logic

**Example**:
```typescript
// __tests__/services/auth.test.ts
describe('Authentication Service', () => {
  describe('verifyCredentials', () => {
    it('should return user for valid credentials', async () => {
      const user = await verifyCredentials('test@example.com', 'password123')
      expect(user).toBeDefined()
      expect(user.email).toBe('test@example.com')
    })
    
    it('should return null for invalid password', async () => {
      const user = await verifyCredentials('test@example.com', 'wrongpassword')
      expect(user).toBeNull()
    })
    
    it('should return null for non-existent user', async () => {
      const user = await verifyCredentials('nonexistent@example.com', 'password')
      expect(user).toBeNull()
    })
  })
})
```

### Integration Tests

**Test Scenarios**:
- Complete authentication flows
- API endpoint interactions
- Database operations
- Email sending
- Session management

**Example**:
```typescript
// __tests__/integration/auth-flow.test.ts
describe('Authentication Flow', () => {
  it('should complete full login flow', async () => {
    // 1. Navigate to login page
    await page.goto('/login')
    
    // 2. Fill in credentials
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    
    // 3. Submit form
    await page.click('[type="submit"]')
    
    // 4. Verify redirect to dashboard
    await page.waitForURL('/dashboard')
    expect(page.url()).toContain('/dashboard')
    
    // 5. Verify user name displayed
    const userName = await page.textContent('[data-testid="user-name"]')
    expect(userName).toBe('Test User')
  })
})
```

### E2E Tests

**Test Scenarios**:
- User registration to first login
- Password reset flow
- Role-based dashboard access
- Search functionality
- Export operations
- Bulk actions

**Tools**: Playwright or Cypress

### Performance Tests

**Metrics to Track**:
- Page load time (<2s)
- API response time (<500ms)
- Time to interactive (<3s)
- First contentful paint (<1.5s)
- Largest contentful paint (<2.5s)

**Tools**: Lighthouse, WebPageTest

### Security Tests

**Test Areas**:
- SQL injection prevention
- XSS prevention
- CSRF protection
- Rate limiting
- Session security
- Password hashing
- Input sanitization

**Tools**: OWASP ZAP, Burp Suite

## Performance Optimization

### Frontend Optimization

1. **Code Splitting**:
   - Route-based splitting (automatic with Next.js)
   - Component lazy loading for modals and heavy components
   - Dynamic imports for charts and visualizations

2. **Image Optimization**:
   - Use Next.js Image component
   - WebP format with fallbacks
   - Lazy loading below the fold
   - Responsive images with srcset

3. **Bundle Optimization**:
   - Tree shaking unused code
   - Minimize third-party dependencies
   - Use production builds
   - Enable compression (gzip/brotli)

4. **Caching Strategy**:
   - Static assets: Cache-Control: public, max-age=31536000, immutable
   - API responses: Cache-Control: private, max-age=60
   - Service worker caching for offline support

### Backend Optimization

1. **Database Optimization**:
   - Add indexes on frequently queried fields
   - Use connection pooling (max 10 connections)
   - Implement query result caching
   - Use select to limit returned fields
   - Batch operations where possible

2. **API Optimization**:
   - Implement response compression
   - Use pagination for large datasets
   - Cache expensive computations
   - Implement rate limiting
   - Use CDN for static assets

3. **Query Optimization**:
```typescript
// Bad: N+1 query problem
const items = await prisma.inventoryItem.findMany()
for (const item of items) {
  const user = await prisma.user.findUnique({ where: { id: item.enteredById } })
}

// Good: Use include to fetch related data
const items = await prisma.inventoryItem.findMany({
  include: {
    enteredBy: {
      select: { id: true, name: true, email: true }
    }
  }
})
```

## Security Considerations

### Authentication Security

1. **Password Security**:
   - Minimum 8 characters
   - Require uppercase, lowercase, number, special character
   - Hash with bcrypt (12 rounds)
   - Never store plain text passwords
   - Implement password history (prevent reuse of last 5)

2. **Session Security**:
   - Use httpOnly cookies
   - Set secure flag in production
   - Implement sameSite: 'lax'
   - Short session duration (24 hours)
   - Rotate session tokens on privilege escalation

3. **Token Security**:
   - Use cryptographically secure random tokens
   - Short expiration times (60 minutes for password reset)
   - Single-use tokens
   - Store hashed tokens in database

### API Security

1. **Input Validation**:
   - Validate all inputs with Zod
   - Sanitize user inputs
   - Implement type checking
   - Reject unexpected fields

2. **Output Encoding**:
   - React automatically escapes JSX
   - Sanitize HTML content
   - Encode JSON responses
   - Set proper Content-Type headers

3. **Rate Limiting**:
   - Implement per-IP rate limiting
   - Implement per-user rate limiting
   - Different limits for different endpoints
   - Return 429 status with Retry-After header

### Data Security

1. **Encryption**:
   - HTTPS only in production
   - Encrypt sensitive data at rest (2FA secrets)
   - Use environment variables for secrets
   - Never commit secrets to git

2. **Access Control**:
   - Implement role-based access control
   - Verify permissions on every request
   - Use principle of least privilege
   - Audit all access to sensitive data

3. **Audit Logging**:
   - Log all authentication events
   - Log all data modifications
   - Log all permission changes
   - Include timestamp, user, IP, action

## Deployment Strategy

### Environment Configuration

**Development**:
```env
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/mais_dev
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production
EMAIL_PROVIDER=smtp
SMTP_HOST=localhost
SMTP_PORT=1025
```

**Production**:
```env
NODE_ENV=production
DATABASE_URL=postgresql://prod-db-url
NEXTAUTH_URL=https://inventory.mais.sa
NEXTAUTH_SECRET=<generated-secret>
EMAIL_PROVIDER=resend
RESEND_API_KEY=<api-key>
```

### Deployment Steps

1. **Pre-Deployment**:
   - Run all tests
   - Build production bundle
   - Run database migrations
   - Verify environment variables
   - Create database backup

2. **Deployment**:
   - Deploy to Vercel
   - Run post-deployment smoke tests
   - Monitor error rates
   - Check performance metrics

3. **Post-Deployment**:
   - Verify all features working
   - Check email delivery
   - Test authentication flows
   - Monitor user feedback

### Rollback Plan

1. **Immediate Rollback**:
   - Revert to previous Vercel deployment
   - Restore database from backup if needed
   - Notify users of temporary issues

2. **Database Rollback**:
   - Run down migrations
   - Restore from backup
   - Verify data integrity

## Monitoring and Maintenance

### Monitoring Metrics

1. **Application Metrics**:
   - Response times (p50, p95, p99)
   - Error rates
   - Request rates
   - Active users

2. **Business Metrics**:
   - Daily active users
   - Login success rate
   - Feature adoption rates
   - User engagement

3. **Infrastructure Metrics**:
   - Database connections
   - Memory usage
   - CPU usage
   - Disk space

### Alerting Rules

1. **Critical Alerts** (immediate notification):
   - Error rate >5%
   - API response time >5s
   - Database connection failures
   - Authentication service down

2. **Warning Alerts** (notification within 1 hour):
   - Error rate >2%
   - API response time >2s
   - High memory usage (>80%)
   - Failed backup

3. **Info Alerts** (daily digest):
   - New user registrations
   - Feature usage statistics
   - Performance trends

### Maintenance Tasks

**Daily**:
- Review error logs
- Check system health dashboard
- Monitor user feedback

**Weekly**:
- Review performance metrics
- Analyze user behavior
- Update help documentation
- Deploy minor updates

**Monthly**:
- Security audit
- Performance optimization
- Database maintenance
- Backup verification
- User satisfaction survey

## Future Enhancements

### Phase 2 (3-6 months)

- Native mobile apps (iOS/Android)
- SSO integration (Azure AD, Okta)
- Advanced workflow approvals
- Real-time collaboration (WebSocket)
- API for third-party integrations

### Phase 3 (6-12 months)

- Multi-company support
- Advanced AI insights
- Predictive analytics
- IoT device integration
- Blockchain audit trail

### Phase 4 (12+ months)

- Voice commands
- AR inventory visualization
- Marketplace for extensions
- White-label solution
- Enterprise features
