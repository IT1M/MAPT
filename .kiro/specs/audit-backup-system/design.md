# Design Document

## Overview

The Audit & Backup System provides comprehensive data tracking, backup management, and report generation capabilities for the Saudi Mais inventory management system. The system consists of three major subsystems:

1. **Audit Trail System**: Tracks all user actions and system events with detailed logging
2. **Backup Management System**: Automates data backups and provides restoration capabilities
3. **Report Generation System**: Creates formatted reports with AI-powered insights

### Key Design Principles

- **Non-blocking audit logging**: Audit operations should never block main business operations
- **Fail-safe backups**: Backup operations must be transactional and verifiable
- **Scalable architecture**: Support for large audit logs and backup files
- **Security-first**: Encryption, access control, and tamper-proof logging
- **Performance optimization**: Caching, pagination, and lazy loading for large datasets
- **Compliance-ready**: Tamper-proof logs with cryptographic signing and retention policies
- **Mobile-first responsive**: Full functionality across all device sizes

### Design Rationale

**Why separate subsystems?** Each subsystem (Audit, Backup, Reports) has distinct responsibilities and can be developed, tested, and scaled independently. This separation allows for better maintainability and future extensibility.

**Why WebSocket for real-time updates?** Audit logs need to reflect system activity in real-time for security monitoring. WebSocket provides efficient bidirectional communication without polling overhead.

**Why cryptographic signing for audit logs?** To meet compliance requirements and prevent tampering, audit entries are signed using HMAC-SHA256, ensuring data integrity and non-repudiation.

**Why transactional backups?** Backup and restore operations must be atomic to prevent partial data corruption. Using database transactions ensures all-or-nothing semantics.

**Why AES-256-GCM for encryption?** GCM mode provides both confidentiality and authenticity, preventing tampering with encrypted backups. AES-256 is industry standard for sensitive data protection.

**Why node-cron for scheduling?** Lightweight, reliable, and integrates seamlessly with Node.js for automated backup and report generation tasks.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Audit Page         │  Backup Page       │  Reports Page    │
│  - AuditLogTable    │  - BackupManagement│  - ReportGen     │
│  - AuditFilters     │  - BackupHistory   │  - ReportHistory │
│  - AuditStats       │  - RestoreDialog   │  - ReportPreview │
│  - DetailsModal     │  - HealthMonitor   │  - ScheduleConfig│
│  - RevertDialog     │  - ValidationPanel │  - EmailSettings │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                              │
├─────────────────────────────────────────────────────────────┤
│  /api/audit/*       │  /api/backup/*     │  /api/reports/*  │
│  - GET logs         │  - POST create     │  - POST generate │
│  - GET stats        │  - POST restore    │  - GET list      │
│  - POST revert      │  - GET list        │  - GET download  │
│  - POST export      │  - DELETE backup   │  - POST schedule │
│  - GET details      │  - POST validate   │  - GET preview   │
│  - WS /live         │  - GET health      │  - POST email    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
├─────────────────────────────────────────────────────────────┤
│  AuditService       │  BackupService     │  ReportService   │
│  - logAction        │  - createBackup    │  - generatePDF   │
│  - queryLogs        │  - restoreBackup   │  - generateExcel │
│  - revertChange     │  - validateBackup  │  - generatePPTX  │
│  - signEntry        │  - encryptBackup   │  - getAIInsights │
│  - exportLogs       │  - applyRetention  │  - scheduleReport│
│  - getStatistics    │  - monitorHealth   │  - emailReport   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                │
├─────────────────────────────────────────────────────────────┤
│  Prisma ORM         │  File System       │  Gemini AI       │
│  - AuditLog model   │  - Backup storage  │  - Insights API  │
│  - Backup model     │  - Report storage  │  - Analysis      │
│  - Report model     │  - Encryption      │  - Trends        │
│  - Schedule model   │  - Checksums       │  - Predictions   │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React, Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (existing schema extended)
- **File Storage**: Local file system with encryption support
- **AI Integration**: Google Gemini API (existing service)
- **PDF Generation**: react-pdf/renderer
- **Excel Generation**: exceljs
- **PowerPoint Generation**: pptxgenjs
- **Real-time**: WebSocket (for live audit updates)
- **Encryption**: Node.js crypto module (AES-256-GCM)
- **Scheduling**: node-cron for automated tasks
- **Email**: nodemailer for notifications

## Components and Interfaces

### Frontend Components

#### 1. Audit Log Components

**AuditLogPage** (`src/app/[locale]/audit/page.tsx`)
- Main audit trail page with role-based access control (ADMIN, AUDITOR)
- Layout: Sidebar filters + Main content area
- Handles routing and authentication checks

**AuditLogTable** (`src/components/audit/AuditLogTable.tsx`)
- Displays audit entries in sortable, paginated table
- Columns: Timestamp, User, Action, Entity Type, Entity ID, Changes, IP Address, User Agent
- Features: Sorting, row expansion, action buttons
- Props:
  ```typescript
  interface AuditLogTableProps {
    entries: AuditEntry[];
    onSort: (column: string, direction: 'asc' | 'desc') => void;
    onViewDetails: (entryId: string) => void;
    onRevert: (entryId: string) => void;
    currentUser: User;
  }
  ```

**AuditFilters** (`src/components/audit/AuditFilters.tsx`)
- Sidebar component with filtering controls
- Filters: Date range, Users, Action types, Entity types, Text search
- Features: Preset date ranges, multi-select, Apply/Reset buttons
- Props:
  ```typescript
  interface AuditFiltersProps {
    onFilterChange: (filters: AuditFilters) => void;
    users: User[];
    initialFilters?: AuditFilters;
  }
  ```

**AuditStatsPanel** (`src/components/audit/AuditStatsPanel.tsx`)
- Dashboard showing audit statistics
- Metrics: Total actions, Most active user, Most common action, Critical actions count
- Charts: Activity over time, User activity leaderboard
- Props:
  ```typescript
  interface AuditStatsPanelProps {
    dateRange: DateRange;
    stats: AuditStatistics;
  }
  ```

**AuditDetailsModal** (`src/components/audit/AuditDetailsModal.tsx`)
- Modal displaying full audit entry details
- Features: Side-by-side old/new values, JSON view, Copy buttons, Related entries
- Props:
  ```typescript
  interface AuditDetailsModalProps {
    entry: AuditEntry;
    relatedEntries: AuditEntry[];
    isOpen: boolean;
    onClose: () => void;
  }
  ```

**RevertChangeDialog** (`src/components/audit/RevertChangeDialog.tsx`)
- Confirmation dialog for reverting changes (ADMIN only)
- Shows preview of changes to be reverted
- Requires explicit confirmation
- Props:
  ```typescript
  interface RevertChangeDialogProps {
    entry: AuditEntry;
    isOpen: boolean;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
  }
  ```

**AuditExportDialog** (`src/components/audit/AuditExportDialog.tsx`)
- Export configuration dialog
- Options: Format (CSV/Excel/PDF), Encryption, Date range
- Shows estimated file size

**LiveAuditIndicator** (`src/components/audit/LiveAuditIndicator.tsx`)
- Real-time update indicator with WebSocket connection status
- Shows "X new entries" badge
- Auto-scroll toggle

#### 2. Backup Management Components

**BackupPage** (`src/app/[locale]/backup/page.tsx`)
- Main backup management page with role-based access (ADMIN, MANAGER)
- Sections: Configuration, History, Health Monitor

**BackupConfigPanel** (`src/components/backup/BackupConfigPanel.tsx`)
- Automatic backup configuration
- Settings: Enable/disable, Schedule time, Formats, Retention policies
- Storage info display
- Props:
  ```typescript
  interface BackupConfigPanelProps {
    config: BackupConfig;
    onSave: (config: BackupConfig) => Promise<void>;
    isAdmin: boolean;
  }
  ```

**BackupHistoryTable** (`src/components/backup/BackupHistoryTable.tsx`)
- Table displaying all backup files
- Columns: Date/Time, Filename, Type, Size, Record Count, Status, Created By, Actions
- Features: Pagination, Filtering, Search, Sorting
- Props:
  ```typescript
  interface BackupHistoryTableProps {
    backups: Backup[];
    onDownload: (backupId: string) => void;
    onRestore: (backupId: string) => void;
    onDelete: (backupId: string) => void;
    onValidate: (backupId: string) => void;
    currentUser: User;
  }
  ```

**CreateBackupDialog** (`src/components/backup/CreateBackupDialog.tsx`)
- Manual backup creation wizard
- Steps: Name, Content selection, Format, Date range, Notes
- Shows estimated size and progress during creation
- Props:
  ```typescript
  interface CreateBackupDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (backup: Backup) => void;
  }
  ```

**RestoreBackupDialog** (`src/components/backup/RestoreBackupDialog.tsx`)
- Restore confirmation and configuration
- Warning messages, Backup details preview
- Options: Full/Merge/Preview, Password re-entry
- Shows progress during restore
- Props:
  ```typescript
  interface RestoreBackupDialogProps {
    backup: Backup;
    isOpen: boolean;
    onConfirm: (options: RestoreOptions) => Promise<RestoreSummary>;
    onCancel: () => void;
  }
  ```

**BackupHealthMonitor** (`src/components/backup/BackupHealthMonitor.tsx`)
- Dashboard showing backup system health
- Metrics: Last backup, Next backup, Backup streak, Failed backups, Avg duration, Storage used
- Alert indicators for issues
- Props:
  ```typescript
  interface BackupHealthMonitorProps {
    health: BackupHealth;
    onRefresh: () => void;
  }
  ```

**BackupValidationPanel** (`src/components/backup/BackupValidationPanel.tsx`)
- Displays validation results for a backup
- Checks: Checksum, Completeness, Format validity, Restore test
- Visual indicators for pass/fail

**BackupProgressModal** (`src/components/backup/BackupProgressModal.tsx`)
- Shows real-time progress for backup/restore operations
- Progress bar, Current step, Estimated time, Cancel option

#### 3. Report Generation Components

**ReportsPage** (`src/app/[locale]/reports/page.tsx`)
- Main reports page with role-based access (ADMIN, MANAGER)
- Sections: Report Generator, Report History, Scheduled Reports

**ReportGeneratorForm** (`src/components/reports/ReportGeneratorForm.tsx`)
- Report configuration form
- Sections: Type, Date range, Content options, Format, Customization, Email settings
- Shows estimated generation time
- Props:
  ```typescript
  interface ReportGeneratorFormProps {
    onGenerate: (config: ReportConfig) => Promise<Report>;
    templates: ReportTemplate[];
  }
  ```

**ReportHistoryTable** (`src/components/reports/ReportHistoryTable.tsx`)
- Table of generated reports
- Columns: Title, Type, Period, Generated Date, Generated By, Size, Format, Status
- Actions: Download, Re-generate, Email, Delete, Preview
- Features: Search, Filter, Sort, Pagination

**ReportPreviewModal** (`src/components/reports/ReportPreviewModal.tsx`)
- In-browser PDF viewer for report preview
- Navigation controls, Zoom, Download button
- Props:
  ```typescript
  interface ReportPreviewModalProps {
    report: Report;
    isOpen: boolean;
    onClose: () => void;
  }
  ```

**ScheduledReportsPanel** (`src/components/reports/ScheduledReportsPanel.tsx`)
- Manage scheduled report generation
- List of schedules with last/next run times
- Create/Edit/Delete/Enable/Disable actions
- Props:
  ```typescript
  interface ScheduledReportsPanelProps {
    schedules: ReportSchedule[];
    onCreate: (schedule: ReportSchedule) => Promise<void>;
    onUpdate: (id: string, schedule: ReportSchedule) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
  }
  ```

**ReportScheduleDialog** (`src/components/reports/ReportScheduleDialog.tsx`)
- Create/edit scheduled report configuration
- Fields: Name, Report type, Frequency, Time, Recipients, Enable toggle

**ReportProgressModal** (`src/components/reports/ReportProgressModal.tsx`)
- Shows generation progress with steps
- Steps: Fetching data (10%), Calculating stats (25%), Generating charts (40%), AI insights (60%), Creating document (80%), Finalizing (95%), Ready (100%)
- Cancel option

**DashboardStatsCards** (`src/components/backup/DashboardStatsCards.tsx`)
- Quick stats cards for dashboard
- Cards: Last Backup, Reports This Month, Storage Usage
- Real-time updates

#### 4. Shared/Utility Components

**MobileCardView** (`src/components/audit/MobileCardView.tsx`)
- Responsive card layout for mobile devices
- Used for audit entries, backups, and reports on small screens

**FilterDrawer** (`src/components/shared/FilterDrawer.tsx`)
- Collapsible filter panel for mobile
- Slide-in drawer with filter controls

**ProgressBar** (`src/components/shared/ProgressBar.tsx`)
- Reusable progress indicator
- Shows percentage, step description, estimated time

**ConfirmationDialog** (`src/components/shared/ConfirmationDialog.tsx`)
- Generic confirmation dialog
- Customizable message, warning level, action buttons

### API Routes

#### Audit API Routes

**GET /api/audit/logs**
- Query audit logs with filtering, sorting, pagination
- Query params: `page`, `limit`, `dateFrom`, `dateTo`, `users`, `actions`, `entities`, `search`
- Response:
  ```typescript
  {
    entries: AuditEntry[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }
  ```

**GET /api/audit/stats**
- Get audit statistics for dashboard
- Query params: `dateFrom`, `dateTo`
- Response:
  ```typescript
  {
    totalActions: number;
    mostActiveUser: { id: string; name: string; count: number };
    mostCommonAction: { type: string; count: number };
    criticalActions: number;
    activityChart: { date: string; counts: Record<ActionType, number> }[];
    userLeaderboard: { userId: string; name: string; count: number }[];
  }
  ```

**GET /api/audit/details/:id**
- Get full details for a specific audit entry
- Includes related entries within time window
- Response: `AuditEntry` with `relatedEntries`

**POST /api/audit/revert**
- Revert a change (ADMIN only)
- Body: `{ entryId: string; confirmation: boolean }`
- Creates new audit entry for revert action
- Response: `{ success: boolean; newEntry: AuditEntry }`

**POST /api/audit/export**
- Export audit logs
- Body: `{ format: 'csv' | 'excel' | 'pdf'; filters: AuditFilters; encrypted: boolean }`
- Returns file download or signed URL
- Creates audit entry for export

**WebSocket /api/audit/live**
- Real-time audit log updates
- Emits new entries as they're created
- Client subscribes with filters

#### Backup API Routes

**GET /api/backup/list**
- List all backups with pagination
- Query params: `page`, `limit`, `type`, `status`, `search`
- Response:
  ```typescript
  {
    backups: Backup[];
    pagination: PaginationInfo;
  }
  ```

**POST /api/backup/create**
- Create manual backup
- Body:
  ```typescript
  {
    name: string;
    includeAuditLogs: boolean;
    includeUserData: boolean;
    includeSettings: boolean;
    format: 'csv' | 'json' | 'sql' | 'all';
    dateRange?: { from: Date; to: Date };
    notes?: string;
    encrypted?: boolean;
    password?: string;
  }
  ```
- Response: `{ backupId: string; status: 'in_progress' | 'completed' }`
- Creates audit entry

**POST /api/backup/restore**
- Restore from backup (ADMIN only)
- Body:
  ```typescript
  {
    backupId: string;
    mode: 'full' | 'merge' | 'preview';
    password?: string;
    adminPassword: string;
  }
  ```
- Creates pre-restore backup automatically
- Response: `RestoreSummary` with items added/updated/skipped
- Creates audit entry

**GET /api/backup/download/:id**
- Download backup file
- Supports resumable downloads
- Creates audit entry

**DELETE /api/backup/:id**
- Delete backup file (ADMIN only)
- Checks retention policy compliance
- Creates audit entry

**POST /api/backup/validate**
- Validate backup integrity
- Body: `{ backupId: string }`
- Response:
  ```typescript
  {
    valid: boolean;
    checks: {
      checksum: boolean;
      completeness: boolean;
      formatValid: boolean;
      restoreTest: boolean;
    };
    errors?: string[];
  }
  ```

**GET /api/backup/health**
- Get backup system health metrics
- Response:
  ```typescript
  {
    lastBackup: Date | null;
    nextBackup: Date | null;
    backupStreak: number;
    failedBackupsLast30Days: number;
    avgDuration: number;
    storageUsed: number;
    storageTotal: number;
    alerts: Alert[];
  }
  ```

**GET /api/backup/config**
- Get backup configuration
- Response: `BackupConfig`

**PUT /api/backup/config**
- Update backup configuration (ADMIN only)
- Body: `BackupConfig`
- Validates and saves configuration

#### Report API Routes

**GET /api/reports/list**
- List generated reports
- Query params: `page`, `limit`, `type`, `search`, `dateFrom`, `dateTo`
- Response:
  ```typescript
  {
    reports: Report[];
    pagination: PaginationInfo;
  }
  ```

**POST /api/reports/generate**
- Generate new report
- Body:
  ```typescript
  {
    type: ReportType;
    dateRange: { from: Date; to: Date };
    content: {
      summary: boolean;
      charts: boolean;
      detailedTable: boolean;
      rejectAnalysis: boolean;
      destinationBreakdown: boolean;
      categoryAnalysis: boolean;
      aiInsights: boolean;
      userActivity: boolean;
      auditTrail: boolean;
      comparative: boolean;
    };
    format: 'pdf' | 'excel' | 'pptx';
    customization: {
      includeLogo: boolean;
      includeSignature: boolean;
      language: 'en' | 'ar' | 'bilingual';
      paperSize: 'a4' | 'letter';
      orientation: 'portrait' | 'landscape';
    };
    email?: {
      enabled: boolean;
      recipients: string[];
      subject: string;
      message: string;
    };
  }
  ```
- Response: `{ reportId: string; status: 'generating' | 'completed' }`
- Creates audit entry

**GET /api/reports/download/:id**
- Download generated report
- Returns file with appropriate content-type

**GET /api/reports/preview/:id**
- Get report preview (PDF only)
- Returns PDF for in-browser viewing

**POST /api/reports/email**
- Email existing report
- Body: `{ reportId: string; recipients: string[]; subject: string; message: string }`

**DELETE /api/reports/:id**
- Delete report
- Creates audit entry

**GET /api/reports/schedules**
- List scheduled reports
- Response: `ReportSchedule[]`

**POST /api/reports/schedules**
- Create scheduled report (ADMIN only)
- Body:
  ```typescript
  {
    name: string;
    reportType: ReportType;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    time: string; // HH:mm format
    recipients: string[];
    enabled: boolean;
    config: ReportConfig;
  }
  ```

**PUT /api/reports/schedules/:id**
- Update scheduled report (ADMIN only)
- Body: `ReportSchedule`

**DELETE /api/reports/schedules/:id**
- Delete scheduled report (ADMIN only)

### Service Layer

#### AuditService (`src/services/audit.ts`)

**Core Methods:**

```typescript
class AuditService {
  // Log an action (non-blocking, queued)
  async logAction(params: {
    userId: string;
    action: ActionType;
    entityType: EntityType;
    entityId: string;
    changes?: Record<string, { old: any; new: any }>;
    ipAddress: string;
    userAgent: string;
  }): Promise<void>;

  // Query audit logs with filters
  async queryLogs(filters: AuditFilters, pagination: Pagination): Promise<{
    entries: AuditEntry[];
    total: number;
  }>;

  // Get audit statistics
  async getStatistics(dateRange: DateRange): Promise<AuditStatistics>;

  // Get entry details with related entries
  async getEntryDetails(entryId: string): Promise<{
    entry: AuditEntry;
    relatedEntries: AuditEntry[];
  }>;

  // Revert a change (ADMIN only)
  async revertChange(entryId: string, adminUserId: string): Promise<AuditEntry>;

  // Export audit logs
  async exportLogs(
    filters: AuditFilters,
    format: 'csv' | 'excel' | 'pdf',
    encrypted: boolean
  ): Promise<string>; // Returns file path or URL

  // Sign audit entry for tamper-proofing
  private signEntry(entry: AuditEntry): string; // Returns HMAC signature

  // Verify entry signature
  verifyEntry(entry: AuditEntry): boolean;
}
```

**Design Decisions:**
- **Non-blocking logging**: Uses a queue (Bull or similar) to prevent audit operations from slowing down main business logic
- **Cryptographic signing**: Each entry is signed with HMAC-SHA256 using a secret key, stored in signature field
- **Related entries**: Queries entries for same entity within ±1 hour window for context

#### BackupService (`src/services/backup.ts`)

**Core Methods:**

```typescript
class BackupService {
  // Create backup
  async createBackup(config: BackupCreateConfig): Promise<Backup>;

  // Restore from backup
  async restoreBackup(
    backupId: string,
    options: RestoreOptions
  ): Promise<RestoreSummary>;

  // Validate backup integrity
  async validateBackup(backupId: string): Promise<ValidationResult>;

  // Encrypt backup file
  private async encryptBackup(
    filePath: string,
    password: string
  ): Promise<string>; // Returns encrypted file path

  // Decrypt backup file
  private async decryptBackup(
    filePath: string,
    password: string
  ): Promise<string>; // Returns decrypted file path

  // Apply retention policies
  async applyRetentionPolicies(): Promise<void>;

  // Monitor backup health
  async getHealthMetrics(): Promise<BackupHealth>;

  // Calculate checksum
  private calculateChecksum(filePath: string): Promise<string>;

  // Verify checksum
  private verifyChecksum(filePath: string, expectedChecksum: string): Promise<boolean>;
}
```

**Design Decisions:**
- **Transactional restore**: Uses Prisma transactions to ensure atomicity
- **Pre-restore backup**: Automatically creates backup before restore for safety
- **AES-256-GCM encryption**: Provides both confidentiality and authenticity
- **SHA-256 checksums**: Stored with each backup for integrity verification
- **Retention policies**: Automated cleanup based on configured rules (daily/weekly/monthly)

#### ReportService (`src/services/report.ts`)

**Core Methods:**

```typescript
class ReportService {
  // Generate report
  async generateReport(config: ReportConfig): Promise<Report>;

  // Generate PDF report
  private async generatePDF(data: ReportData, config: ReportConfig): Promise<string>;

  // Generate Excel report
  private async generateExcel(data: ReportData, config: ReportConfig): Promise<string>;

  // Generate PowerPoint report
  private async generatePPTX(data: ReportData, config: ReportConfig): Promise<string>;

  // Get AI insights from Gemini
  async getAIInsights(data: ReportData): Promise<AIInsights>;

  // Email report
  async emailReport(reportId: string, recipients: string[], subject: string, message: string): Promise<void>;

  // Schedule report generation
  async scheduleReport(schedule: ReportSchedule): Promise<void>;

  // Execute scheduled report
  async executeScheduledReport(scheduleId: string): Promise<Report>;
}
```

**Design Decisions:**
- **Modular generation**: Separate methods for each format (PDF/Excel/PPTX) for maintainability
- **AI integration**: Uses existing Gemini service for insights, with fallback if unavailable
- **Async generation**: Long-running report generation doesn't block API responses
- **Template-based**: Uses react-pdf/renderer for consistent PDF styling

### Data Models

#### Prisma Schema Extensions

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  timestamp   DateTime @default(now())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  action      ActionType
  entityType  EntityType
  entityId    String
  changes     Json?    // { field: { old: value, new: value } }
  ipAddress   String
  userAgent   String
  signature   String   // HMAC-SHA256 signature for tamper-proofing
  
  @@index([timestamp])
  @@index([userId])
  @@index([entityType, entityId])
  @@index([action])
}

enum ActionType {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  EXPORT
  VIEW
  REVERT
  BACKUP
  RESTORE
}

enum EntityType {
  InventoryItem
  User
  Report
  Backup
  Settings
  AuditLog
}

model Backup {
  id              String   @id @default(cuid())
  filename        String   @unique
  type            BackupType
  format          BackupFormat
  fileSize        BigInt
  recordCount     Int
  status          BackupStatus
  createdAt       DateTime @default(now())
  createdBy       String
  creator         User     @relation(fields: [createdBy], references: [id])
  includeAuditLogs Boolean @default(false)
  includeUserData Boolean @default(false)
  includeSettings Boolean @default(false)
  dateRangeFrom   DateTime?
  dateRangeTo     DateTime?
  notes           String?
  encrypted       Boolean  @default(false)
  checksum        String   // SHA-256 checksum
  validated       Boolean  @default(false)
  validatedAt     DateTime?
  
  @@index([createdAt])
  @@index([status])
  @@index([type])
}

enum BackupType {
  MANUAL
  AUTOMATIC
  PRE_RESTORE
}

enum BackupFormat {
  CSV
  JSON
  SQL
}

enum BackupStatus {
  IN_PROGRESS
  COMPLETED
  FAILED
  CORRUPTED
}

model Report {
  id              String   @id @default(cuid())
  title           String
  type            ReportType
  periodFrom      DateTime
  periodTo        DateTime
  generatedAt     DateTime @default(now())
  generatedBy     String
  generator       User     @relation(fields: [generatedBy], references: [id])
  fileSize        BigInt
  format          ReportFormat
  status          ReportStatus
  filePath        String
  includeAIInsights Boolean @default(false)
  
  @@index([generatedAt])
  @@index([type])
  @@index([status])
}

enum ReportType {
  MONTHLY_INVENTORY
  YEARLY_SUMMARY
  CUSTOM_RANGE
  AUDIT_REPORT
  USER_ACTIVITY
  CATEGORY_ANALYSIS
}

enum ReportFormat {
  PDF
  EXCEL
  PPTX
}

enum ReportStatus {
  GENERATING
  COMPLETED
  FAILED
}

model ReportSchedule {
  id          String   @id @default(cuid())
  name        String
  reportType  ReportType
  frequency   ScheduleFrequency
  time        String   // HH:mm format
  recipients  String[] // Email addresses
  enabled     Boolean  @default(true)
  config      Json     // ReportConfig
  lastRun     DateTime?
  nextRun     DateTime
  createdAt   DateTime @default(now())
  createdBy   String
  creator     User     @relation(fields: [createdBy], references: [id])
  
  @@index([nextRun])
  @@index([enabled])
}

enum ScheduleFrequency {
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}

model BackupConfig {
  id                  String   @id @default(cuid())
  enabled             Boolean  @default(false)
  scheduleTime        String   @default("02:00") // HH:mm format
  formats             BackupFormat[]
  includeAuditLogs    Boolean  @default(true)
  retentionDailyDays  Int      @default(30)
  retentionWeeklyWeeks Int     @default(12)
  retentionMonthlyMonths Int   @default(12)
  storagePath         String
  updatedAt           DateTime @updatedAt
  updatedBy           String
  updater             User     @relation(fields: [updatedBy], references: [id])
}
```

**Design Decisions:**
- **Separate models**: Each subsystem has dedicated models for clear separation of concerns
- **Enums for type safety**: Using Prisma enums prevents invalid values
- **Indexes**: Strategic indexes on frequently queried fields (timestamp, status, type)
- **Relations**: Proper foreign keys to User model for audit trail
- **JSON fields**: Flexible storage for changes and configurations
- **BigInt for file sizes**: Supports large backup files

## Data Models

### TypeScript Interfaces

```typescript
interface AuditEntry {
  id: string;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  action: ActionType;
  entityType: EntityType;
  entityId: string;
  changes?: Record<string, { old: any; new: any }>;
  ipAddress: string;
  userAgent: string;
  signature: string;
}

interface AuditFilters {
  dateFrom?: Date;
  dateTo?: Date;
  userIds?: string[];
  actions?: ActionType[];
  entityTypes?: EntityType[];
  search?: string;
}

interface AuditStatistics {
  totalActions: number;
  mostActiveUser: { id: string; name: string; count: number };
  mostCommonAction: { type: ActionType; count: number };
  criticalActions: number;
  activityChart: { date: string; counts: Record<ActionType, number> }[];
  userLeaderboard: { userId: string; name: string; count: number }[];
}

interface Backup {
  id: string;
  filename: string;
  type: BackupType;
  format: BackupFormat;
  fileSize: number;
  recordCount: number;
  status: BackupStatus;
  createdAt: Date;
  createdBy: string;
  creator: User;
  includeAuditLogs: boolean;
  includeUserData: boolean;
  includeSettings: boolean;
  dateRangeFrom?: Date;
  dateRangeTo?: Date;
  notes?: string;
  encrypted: boolean;
  checksum: string;
  validated: boolean;
  validatedAt?: Date;
}

interface BackupConfig {
  enabled: boolean;
  scheduleTime: string;
  formats: BackupFormat[];
  includeAuditLogs: boolean;
  retentionDailyDays: number;
  retentionWeeklyWeeks: number;
  retentionMonthlyMonths: number;
  storagePath: string;
}

interface BackupHealth {
  lastBackup: Date | null;
  nextBackup: Date | null;
  backupStreak: number;
  failedBackupsLast30Days: number;
  avgDuration: number;
  storageUsed: number;
  storageTotal: number;
  alerts: Alert[];
}

interface RestoreOptions {
  mode: 'full' | 'merge' | 'preview';
  password?: string;
  adminPassword: string;
}

interface RestoreSummary {
  itemsAdded: number;
  itemsUpdated: number;
  itemsSkipped: number;
  errors: string[];
  duration: number;
}

interface Report {
  id: string;
  title: string;
  type: ReportType;
  periodFrom: Date;
  periodTo: Date;
  generatedAt: Date;
  generatedBy: string;
  generator: User;
  fileSize: number;
  format: ReportFormat;
  status: ReportStatus;
  filePath: string;
  includeAIInsights: boolean;
}

interface ReportConfig {
  type: ReportType;
  dateRange: { from: Date; to: Date };
  content: {
    summary: boolean;
    charts: boolean;
    detailedTable: boolean;
    rejectAnalysis: boolean;
    destinationBreakdown: boolean;
    categoryAnalysis: boolean;
    aiInsights: boolean;
    userActivity: boolean;
    auditTrail: boolean;
    comparative: boolean;
  };
  format: ReportFormat;
  customization: {
    includeLogo: boolean;
    includeSignature: boolean;
    language: 'en' | 'ar' | 'bilingual';
    paperSize: 'a4' | 'letter';
    orientation: 'portrait' | 'landscape';
  };
  email?: {
    enabled: boolean;
    recipients: string[];
    subject: string;
    message: string;
  };
}

interface AIInsights {
  trends: string[];
  anomalies: string[];
  recommendations: string[];
  predictions: string[];
}

interface ReportSchedule {
  id: string;
  name: string;
  reportType: ReportType;
  frequency: ScheduleFrequency;
  time: string;
  recipients: string[];
  enabled: boolean;
  config: ReportConfig;
  lastRun?: Date;
  nextRun: Date;
  createdAt: Date;
  createdBy: string;
}
```

## Error Handling

### Error Types

```typescript
class AuditError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuditError';
  }
}

class BackupError extends Error {
  constructor(message: string, public code: string, public recoverable: boolean = false) {
    super(message);
    this.name = 'BackupError';
  }
}

class ReportError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ReportError';
  }
}
```

### Error Codes

**Audit Errors:**
- `AUDIT_UNAUTHORIZED`: User lacks permission
- `AUDIT_ENTRY_NOT_FOUND`: Entry doesn't exist
- `AUDIT_REVERT_FAILED`: Revert operation failed
- `AUDIT_SIGNATURE_INVALID`: Entry signature verification failed
- `AUDIT_EXPORT_FAILED`: Export operation failed

**Backup Errors:**
- `BACKUP_UNAUTHORIZED`: User lacks permission
- `BACKUP_CREATE_FAILED`: Backup creation failed
- `BACKUP_RESTORE_FAILED`: Restore operation failed
- `BACKUP_NOT_FOUND`: Backup file not found
- `BACKUP_CORRUPTED`: Backup file is corrupted
- `BACKUP_DECRYPT_FAILED`: Decryption failed (wrong password)
- `BACKUP_STORAGE_FULL`: Insufficient storage space
- `BACKUP_RETENTION_VIOLATION`: Cannot delete backup within retention period

**Report Errors:**
- `REPORT_UNAUTHORIZED`: User lacks permission
- `REPORT_GENERATION_FAILED`: Report generation failed
- `REPORT_NOT_FOUND`: Report doesn't exist
- `REPORT_AI_UNAVAILABLE`: Gemini AI service unavailable
- `REPORT_EMAIL_FAILED`: Email sending failed

### Error Handling Strategy

1. **API Layer**: Catch errors, log them, return appropriate HTTP status codes
2. **Service Layer**: Throw typed errors with descriptive messages
3. **Frontend**: Display user-friendly error messages with recovery options
4. **Audit**: Log all errors in audit trail for debugging
5. **Notifications**: Send alerts for critical errors (backup failures, etc.)

## Testing Strategy

### Unit Tests

**Audit Service Tests:**
- Test audit entry creation and signing
- Test signature verification
- Test query filtering and pagination
- Test revert logic
- Test export functionality

**Backup Service Tests:**
- Test backup creation with different configurations
- Test encryption/decryption
- Test checksum calculation and verification
- Test restore logic (full, merge, preview modes)
- Test retention policy application
- Test validation checks

**Report Service Tests:**
- Test PDF generation with different configurations
- Test Excel generation
- Test AI insights integration (with mocks)
- Test email functionality
- Test schedule execution

### Integration Tests

- Test complete audit flow: action → log → query → export
- Test complete backup flow: create → validate → restore
- Test complete report flow: configure → generate → download
- Test WebSocket real-time updates
- Test scheduled tasks execution
- Test role-based access control across all endpoints

### End-to-End Tests

- Test audit trail page with filtering and sorting
- Test backup creation and restoration workflow
- Test report generation with AI insights
- Test mobile responsive layouts
- Test error scenarios and recovery

## Security Considerations

### Authentication & Authorization

- **Role-based access**: ADMIN, AUDITOR, MANAGER roles with specific permissions
- **Session validation**: All API routes validate user session
- **Password re-entry**: Critical operations (restore, delete) require password confirmation
- **Audit logging**: All security-sensitive operations are logged

### Data Protection

- **Encryption at rest**: Backup files can be encrypted with AES-256-GCM
- **Encryption in transit**: HTTPS for all API communication
- **Cryptographic signing**: Audit entries signed with HMAC-SHA256
- **Secure key storage**: Encryption keys stored in environment variables
- **Password hashing**: Admin passwords hashed with bcrypt

### Input Validation

- **API input validation**: Zod schemas for all API inputs
- **SQL injection prevention**: Prisma ORM with parameterized queries
- **XSS prevention**: React's built-in escaping + DOMPurify for user content
- **File upload validation**: Strict file type and size checks for backups

### Rate Limiting

- **API rate limits**: Prevent abuse of export and generation endpoints
- **WebSocket throttling**: Limit real-time update frequency
- **Failed attempt tracking**: Lock accounts after repeated failed operations

## Performance Optimization

### Frontend Optimization

- **Lazy loading**: Components loaded on-demand
- **Virtual scrolling**: For large audit log tables
- **Debounced search**: 300ms delay for search inputs
- **Pagination**: Limit results to 25-50 per page
- **Caching**: Cache user list, action types, entity types
- **Optimistic updates**: Immediate UI feedback for actions

### Backend Optimization

- **Database indexes**: Strategic indexes on frequently queried fields
- **Query optimization**: Use Prisma's select and include efficiently
- **Async operations**: Non-blocking audit logging with queue
- **Streaming**: Stream large files for download
- **Compression**: Gzip compression for API responses
- **Connection pooling**: Prisma connection pool configuration

### File Operations

- **Chunked reading**: Read large backup files in chunks
- **Parallel processing**: Generate multiple report sections in parallel
- **Temporary files**: Clean up temp files after operations
- **Storage monitoring**: Alert when storage reaches 80% capacity

## Deployment Considerations

### Environment Variables

```env
# Audit
AUDIT_SIGNING_SECRET=<secret-key-for-hmac>
AUDIT_QUEUE_REDIS_URL=<redis-url-for-queue>

# Backup
BACKUP_STORAGE_PATH=/var/backups/mais-inventory
BACKUP_ENCRYPTION_KEY=<encryption-key>
BACKUP_MAX_STORAGE_GB=100

# Reports
REPORT_STORAGE_PATH=/var/reports/mais-inventory
GEMINI_API_KEY=<existing-gemini-key>

# Email
SMTP_HOST=<smtp-server>
SMTP_PORT=587
SMTP_USER=<smtp-username>
SMTP_PASSWORD=<smtp-password>
SMTP_FROM=noreply@mais-inventory.com

# Scheduling
CRON_TIMEZONE=Asia/Riyadh
```

### Scheduled Tasks

**Backup Cron Job:**
- Runs at configured time (default 2:00 AM)
- Creates automatic backup
- Applies retention policies
- Sends email notifications

**Report Cron Job:**
- Checks for scheduled reports every hour
- Executes due reports
- Emails to configured recipients

**Cleanup Cron Job:**
- Runs daily at 3:00 AM
- Removes temporary files
- Cleans up old audit logs (optional, based on retention)

### Storage Requirements

- **Audit logs**: ~1KB per entry, estimate based on activity
- **Backups**: Varies by data size, typically 10-100MB per backup
- **Reports**: 1-10MB per report depending on content
- **Total**: Recommend 100GB+ storage for production

### Monitoring

- **Health checks**: `/api/health` endpoint for monitoring
- **Metrics**: Track backup success rate, report generation time, audit log growth
- **Alerts**: Email notifications for failures and warnings
- **Logs**: Structured logging for debugging

## Mobile Responsive Design

### Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Adaptations

**Audit Page:**
- Filters in collapsible drawer
- Card view instead of table
- Simplified columns (hide IP, User Agent)
- Touch-friendly action buttons

**Backup Page:**
- Stacked layout for config and history
- Card view for backup list
- Step-by-step wizard for creation
- Simplified validation display

**Reports Page:**
- Accordion for report configuration
- Card view for report history
- Mobile-optimized PDF preview
- Touch-friendly download buttons

### Touch Interactions

- Swipe to reveal actions
- Pull to refresh for live updates
- Long press for context menus
- Touch-friendly button sizes (min 44x44px)

## Internationalization

### Supported Languages

- English (en)
- Arabic (ar)

### RTL Support

- Automatic layout flip for Arabic
- RTL-aware chart rendering
- Mirrored icons and animations
- Proper text alignment

### Translation Keys

All UI text uses i18n keys:
- `audit.*` - Audit trail translations
- `backup.*` - Backup management translations
- `reports.*` - Report generation translations
- `common.*` - Shared translations

## Compliance Features

### Tamper-Proof Audit Logs

- **Cryptographic signing**: Each entry signed with HMAC-SHA256
- **Signature verification**: API endpoint to verify entry integrity
- **Immutable logs**: No edit or delete operations on audit entries
- **Chain of custody**: Track who accessed/exported logs

### Retention Policies

- **Configurable retention**: Daily/weekly/monthly backup retention
- **Compliance enforcement**: Prevent deletion within retention period
- **Audit log retention**: Optional long-term audit log archival
- **Legal hold**: Flag backups for legal hold to prevent deletion

### Export for Compliance

- **Structured exports**: CSV/Excel/PDF formats for auditors
- **Digital signatures**: PDF exports include digital signature
- **Metadata inclusion**: Export includes all relevant metadata
- **Encrypted exports**: Option to encrypt sensitive exports

### Audit Trail of Audit System

- **Meta-auditing**: Audit system logs its own operations
- **Access logging**: Track who viewed/exported audit logs
- **Configuration changes**: Log all config changes with before/after values
- **Compliance reports**: Generate compliance-ready audit reports

## Future Enhancements

### Phase 2 Features

- **Cloud storage integration**: S3, Azure Blob, Google Cloud Storage
- **Advanced analytics**: Machine learning for anomaly detection
- **Automated compliance reports**: Pre-configured compliance report templates
- **Multi-tenant support**: Separate audit trails per organization
- **API webhooks**: Real-time notifications via webhooks
- **Advanced scheduling**: More complex cron expressions
- **Backup compression**: Reduce storage with compression
- **Incremental backups**: Only backup changes since last backup
- **Disaster recovery**: Automated failover and recovery procedures
- **Advanced search**: Full-text search with Elasticsearch

### Scalability Improvements

- **Audit log archival**: Move old logs to cold storage
- **Distributed backups**: Replicate backups across multiple locations
- **Load balancing**: Distribute report generation across workers
- **Caching layer**: Redis cache for frequently accessed data
- **CDN integration**: Serve reports via CDN for faster downloads

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-18  
**Status**: Ready for Implementation
