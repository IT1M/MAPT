# Role-Specific Dashboard Components

This document describes the role-specific dashboard components implemented for the Saudi Mais Medical Products Inventory System.

## Overview

Each user role has a customized dashboard experience with widgets and components tailored to their responsibilities and permissions.

## Admin Dashboard

**Components:**
- `SystemHealthWidget` - Real-time system health monitoring (database, AI, backups, storage, active users)
- `QuickActionsPanel` - Quick access buttons for common admin tasks (create user, backup, reports, settings, audit logs, analytics)
- `UserActivityChart` - Bar chart showing user activity over the last 7 days
- `AlertsPanel` - System alerts and notifications with severity indicators
- `SystemStatisticsCards` - KPI cards showing total users, items, today's entries, and system uptime

**Focus:** System administration, monitoring, and maintenance

## Manager Dashboard

**Components:**
- `ExecutiveSummaryCards` - High-level KPIs (total items, revenue impact, reject rate, efficiency)
- `AnalyticsOverview` - Interactive charts with time range selection (7d, 30d, 90d)
- `ReportsCenter` - Recent reports list with status badges and quick generation
- `TeamPerformance` - Team member performance metrics with accuracy indicators
- `AIInsightsWidget` - Gemini AI-powered insights and recommendations

**Focus:** Strategic decision-making, analytics, and team oversight

## Supervisor Dashboard

**Components:**
- `ItemsRequiringReview` - Flagged items needing supervisor attention with reasons
- `TeamActivityMonitor` - Real-time feed of team member actions (live updates every 30s)
- `QualityControlDashboard` - Quality metrics including reject rate, high reject items, and quality trends
- `RecentEntriesTable` - Table of the last 50 inventory entries
- `AuditHighlights` - Important audit events with severity levels

**Focus:** Quality control, team supervision, and operational oversight

## Data Entry Dashboard

**Components:**
- `AddNewItemCard` - Prominent call-to-action card for adding new items with keyboard shortcuts
- `TodaysEntries` - List of items entered by the user today
- `PersonalStats` - Personal performance metrics (today, week, month, accuracy)
- `RecentBatches` - Quick reference to recently used batch numbers
- `TipsWidget` - Rotating productivity tips and best practices

**Focus:** Efficient data entry and personal productivity

## Auditor Dashboard

**Components:**
- `AdvancedSearchBar` - Powerful search interface for audit logs with filters and quick searches
- `AuditOverview` - Summary cards showing total events, today's events, critical events, and unique users
- `ActivityHeatmap` - Visual heatmap showing activity patterns by day and hour
- `UserBehaviorAnalysis` - User behavior analysis with anomaly detection

**Focus:** Audit trail investigation and security monitoring

## API Endpoints Required

Each dashboard component fetches data from specific API endpoints:

### Admin
- `GET /api/dashboard/system-health` - System health status
- `GET /api/dashboard/user-activity` - User activity data
- `GET /api/dashboard/alerts` - System alerts
- `GET /api/dashboard/system-stats` - System statistics

### Manager
- `GET /api/dashboard/executive-summary` - Executive summary data
- `GET /api/dashboard/analytics?range={7d|30d|90d}` - Analytics data
- `GET /api/dashboard/recent-reports` - Recent reports
- `GET /api/dashboard/team-performance` - Team performance metrics

### Supervisor
- `GET /api/dashboard/items-for-review` - Items requiring review
- `GET /api/dashboard/team-activity` - Team activity feed
- `GET /api/dashboard/quality-metrics` - Quality control metrics
- `GET /api/dashboard/recent-entries?limit=10` - Recent entries
- `GET /api/dashboard/audit-highlights` - Audit highlights

### Data Entry
- `GET /api/dashboard/my-entries-today` - User's entries today
- `GET /api/dashboard/my-stats` - Personal statistics
- `GET /api/dashboard/recent-batches` - Recent batch numbers

### Auditor
- `GET /api/dashboard/audit-overview` - Audit overview statistics
- `GET /api/dashboard/activity-heatmap` - Activity heatmap data
- `GET /api/dashboard/user-behavior` - User behavior analysis

## Features

### Real-time Updates
- System health refreshes every 30 seconds
- Team activity monitor updates every 30 seconds
- Live indicators show when data is being updated

### Responsive Design
- All components are fully responsive
- Mobile-optimized layouts
- Touch-friendly interactions

### Dark Mode Support
- All components support dark mode
- Proper color contrast in both themes
- Smooth theme transitions

### Loading States
- Skeleton loaders for better UX
- Graceful error handling
- Empty state messages

### Accessibility
- ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- Proper color contrast

## Usage Example

```tsx
import { RoleBasedDashboard } from '@/components/dashboard'

export default function DashboardPage() {
  const data = {
    userName: 'John Doe',
    userRole: 'Admin',
    role: 'ADMIN',
    todayCount: 45,
    weekCount: 312,
    monthCount: 1250,
    totalItems: 15000,
    rejectRate: 3.5,
    activeUsers: 12,
    maisPercentage: 60,
    fozanPercentage: 40,
    trendData: [10, 15, 12, 18, 20, 16, 22],
    recentActivities: []
  }

  return <RoleBasedDashboard data={data} />
}
```

## Customization

To add new components to a role-specific dashboard:

1. Create the component in the appropriate role folder (e.g., `src/components/dashboard/admin/`)
2. Export it from the role's index file
3. Import and use it in `RoleBasedDashboard.tsx`
4. Create the corresponding API endpoint if needed

## Testing

Each component should be tested for:
- Data loading and error states
- User interactions
- Responsive behavior
- Accessibility compliance
- Dark mode appearance
