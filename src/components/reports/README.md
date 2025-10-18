# Reports UI Components

This directory contains all the UI components for the Reports Management System.

## Components

### ReportsManagementPage
Main container component that manages the reports interface with three tabs:
- Generate New Report
- Report History
- Scheduled Reports (Admin only)

**Features:**
- Role-based access control (ADMIN, MANAGER can generate; AUDITOR can view)
- Tab-based navigation
- State management for reports and schedules
- Integration with all sub-components

### ReportGeneratorForm
Comprehensive form for configuring and generating reports.

**Features:**
- Report type selection (Monthly, Yearly, Custom, Audit, User Activity, Category Analysis)
- Date range picker
- Content options (10 checkboxes for different report sections)
- Format selection (PDF, Excel, PowerPoint)
- Customization options (logo, signature, language, paper size, orientation)
- Email settings with recipient management
- Real-time validation

### ReportHistoryTable
Displays all generated reports in a searchable, filterable table.

**Features:**
- Search by report title
- Filter by report type
- Sortable columns
- Status badges (Completed, Generating, Failed)
- Action buttons (Preview, Download, Email, Delete)
- Pagination
- Responsive design with mobile card view

### ReportPreviewModal
Modal for previewing PDF reports in-browser.

**Features:**
- Embedded PDF viewer using iframe
- Download button
- Fallback message for non-PDF formats
- Full-screen modal with overlay

### ReportProgressModal
Shows real-time progress during report generation.

**Features:**
- Progress bar with percentage
- Step-by-step status updates:
  - Fetching data (10%)
  - Calculating stats (25%)
  - Generating charts (40%)
  - Requesting AI insights (60%)
  - Creating document (80%)
  - Finalizing (95%)
  - Ready (100%)
- Cancel button
- Success indicator

### ScheduledReportsPanel
Manages scheduled report generation (Admin only).

**Features:**
- List of all scheduled reports
- Create/Edit/Delete schedules
- Enable/Disable toggle
- Display schedule details (frequency, time, recipients, last/next run)
- Integration with ReportScheduleDialog

### ReportScheduleDialog
Modal for creating and editing report schedules.

**Features:**
- Schedule name input
- Report type selection
- Frequency selection (Daily, Weekly, Monthly, Yearly)
- Time picker
- Recipient email management
- Enable/disable toggle
- Form validation

## Mobile Responsiveness

All components are fully responsive with:
- Adaptive layouts for mobile, tablet, and desktop
- Touch-friendly buttons and controls
- Collapsible sections on mobile
- Card views for small screens
- Responsive tables with horizontal scroll

## Internationalization

All components support:
- English (en)
- Arabic (ar)
- RTL layout for Arabic
- Translation keys in messages/en.json and messages/ar.json

## Integration

### API Endpoints Used
- `GET /api/reports` - List reports
- `POST /api/reports/generate` - Generate new report
- `GET /api/reports/download/:id` - Download report
- `GET /api/reports/preview/:id` - Preview PDF
- `DELETE /api/reports/:id` - Delete report
- `GET /api/reports/schedules` - List schedules
- `POST /api/reports/schedules` - Create schedule
- `PUT /api/reports/schedules/:id` - Update schedule
- `DELETE /api/reports/schedules/:id` - Delete schedule

### Usage Example

```tsx
import ReportsManagementPage from '@/components/reports/ReportsManagementPage';

export default function ReportsPage({ params }: { params: { locale: string } }) {
  return <ReportsManagementPage locale={params.locale} userRole="ADMIN" />;
}
```

## Requirements Covered

This implementation covers the following requirements from the spec:

- **Requirement 21**: Report Generation Configuration
  - All report types supported
  - Date range selection
  - Content options
  - Format selection (PDF, Excel, PowerPoint)
  - Customization options
  - Email settings

- **Requirement 22**: Report Generation Execution
  - Progress tracking
  - Step-by-step updates
  - Cancel functionality
  - Success/failure handling

- **Requirement 25**: Report History Management
  - Table view with all report details
  - Search and filter
  - Actions (Download, Preview, Email, Delete)
  - Pagination

- **Requirement 26**: Scheduled Report Generation
  - Create/Edit/Delete schedules
  - Frequency configuration
  - Recipient management
  - Enable/Disable functionality

- **Requirement 28**: Mobile Responsive Design
  - Adaptive layouts
  - Touch-friendly controls
  - Card views for mobile
  - Responsive tables

## Dark Mode Support

All components support dark mode with:
- Dark background colors
- Adjusted text colors
- Dark-themed borders and shadows
- Proper contrast ratios

## Accessibility

Components include:
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Focus indicators
- Screen reader friendly

## Future Enhancements

Potential improvements:
- Advanced filtering options
- Bulk operations on reports
- Report templates
- Custom report builder
- Export to more formats
- Report sharing via link
- Report versioning
