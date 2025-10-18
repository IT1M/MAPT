# Audit, Backup & Report System Documentation

## Overview

This document provides comprehensive information about the Audit Trail, Backup Management, and Report Generation systems implemented in the Saudi Mais Inventory Management System.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Environment Configuration](#environment-configuration)
3. [Audit System](#audit-system)
4. [Backup System](#backup-system)
5. [Report System](#report-system)
6. [Cron Jobs](#cron-jobs)
7. [Deployment Guide](#deployment-guide)
8. [Troubleshooting](#troubleshooting)

## System Architecture

The system consists of three major subsystems:

### 1. Audit Trail System
- Tracks all user actions and system events
- Cryptographic signing for tamper-proof logs
- Real-time updates via WebSocket
- Advanced filtering and search capabilities
- Export functionality (CSV, Excel, PDF)

### 2. Backup Management System
- Automated daily backups
- Multiple format support (CSV, JSON, SQL)
- Encryption with AES-256-GCM
- Integrity validation with SHA-256 checksums
- Retention policy management
- Health monitoring

### 3. Report Generation System
- Multiple report types (Monthly, Yearly, Custom, Audit, etc.)
- AI-powered insights via Gemini API
- Multiple formats (PDF, Excel, PowerPoint)
- Scheduled report generation
- Email delivery

## Environment Configuration

### Required Environment Variables

```bash
# Audit System
AUDIT_SIGNING_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32

# Backup System
BACKUP_STORAGE_PATH="/var/backups/mais-inventory"
BACKUP_ENCRYPTION_KEY="your-key-here"  # Generate with: openssl rand -base64 32
BACKUP_MAX_STORAGE_GB="100"

# Report System
REPORT_STORAGE_PATH="/var/reports/mais-inventory"

# Email/SMTP
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-username"
SMTP_PASSWORD="your-password"
SMTP_FROM="noreply@mais-inventory.com"
ADMIN_EMAIL="admin@mais-inventory.com"

# Cron/Scheduling
CRON_TIMEZONE="Asia/Riyadh"
```

### Validation

Run the configuration validation script before deployment:

```bash
npm run validate:audit-backup
```

This will check all required environment variables and provide warnings for missing optional configurations.

## Audit System

### Features

- **Comprehensive Logging**: Tracks CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, VIEW, REVERT, BACKUP, and RESTORE actions
- **Tamper-Proof**: Each entry is cryptographically signed with HMAC-SHA256
- **Real-time Updates**: WebSocket connection for live audit log updates
- **Advanced Filtering**: Filter by date range, user, action type, entity type, and text search
- **Change Reversion**: Administrators can revert changes made to inventory items
- **Export**: Export audit logs in CSV, Excel, or PDF format with optional encryption

### Access Control

- **ADMIN**: Full access including revert capabilities
- **AUDITOR**: Read-only access to all audit logs
- **Other roles**: No access

### API Endpoints

```
GET  /api/audit/logs          - Query audit logs with filters
GET  /api/audit/stats         - Get audit statistics
GET  /api/audit/details/:id   - Get entry details
POST /api/audit/revert        - Revert a change (ADMIN only)
POST /api/audit/export        - Export audit logs
WS   /api/audit/live          - Real-time updates
```

### Usage Example

```typescript
import { AuditService } from '@/services/audit';

const auditService = new AuditService();

// Log an action
await auditService.logAction({
  userId: user.id,
  action: 'UPDATE',
  entityType: 'InventoryItem',
  entityId: item.id,
  changes: {
    quantity: { old: 100, new: 150 },
  },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});

// Query logs
const { entries, total } = await auditService.queryLogs(
  {
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-12-31'),
    actions: ['UPDATE', 'DELETE'],
  },
  { page: 1, limit: 25 }
);
```

## Backup System

### Features

- **Automatic Backups**: Scheduled daily backups at configured time
- **Multiple Formats**: CSV, JSON, and SQL dump formats
- **Encryption**: AES-256-GCM encryption for sensitive backups
- **Integrity Validation**: SHA-256 checksums for all backups
- **Retention Policies**: Configurable retention for daily, weekly, and monthly backups
- **Health Monitoring**: Track backup success rate, storage usage, and system health
- **Restore Options**: Full restore, merge mode, or preview mode

### Access Control

- **ADMIN**: Full access including restore and delete
- **MANAGER**: View and download backups
- **Other roles**: No access

### API Endpoints

```
GET    /api/backup/list       - List all backups
POST   /api/backup/create     - Create manual backup
POST   /api/backup/restore    - Restore from backup (ADMIN only)
GET    /api/backup/download/:id - Download backup file
DELETE /api/backup/:id        - Delete backup (ADMIN only)
POST   /api/backup/validate   - Validate backup integrity
GET    /api/backup/health     - Get health metrics
GET    /api/backup/config     - Get backup configuration
PUT    /api/backup/config     - Update configuration (ADMIN only)
```

### Automatic Backup Configuration

Configure automatic backups in the Backup Management page:

1. Navigate to `/[locale]/backup`
2. Click "Edit" in the Automatic Backup Configuration section
3. Configure:
   - Enable/disable automatic backups
   - Schedule time (default: 2:00 AM)
   - Backup formats (CSV, JSON, SQL)
   - Include audit logs
   - Retention policies

### Manual Backup Creation

```typescript
import { BackupService } from '@/services/backup';

const backupService = new BackupService();

const backup = await backupService.createBackup({
  name: 'manual-backup-2024-10-18',
  includeAuditLogs: true,
  includeUserData: true,
  includeSettings: true,
  format: 'JSON',
  type: 'MANUAL',
  encrypted: true,
  password: 'secure-password',
});
```

### Restore Process

1. Navigate to backup history
2. Click "Restore" on desired backup
3. Choose restore mode:
   - **Preview**: See what will be restored without making changes
   - **Merge**: Add missing items and update existing ones
   - **Full Restore**: Replace all data (creates pre-restore backup)
4. Enter admin password for authorization
5. Confirm and execute restore

## Report System

### Features

- **Multiple Report Types**:
  - Monthly Inventory Report
  - Yearly Summary Report
  - Custom Date Range Report
  - Audit Report
  - User Activity Report
  - Category Analysis Report

- **AI-Powered Insights**: Integration with Gemini API for intelligent analysis
- **Multiple Formats**: PDF, Excel, PowerPoint
- **Scheduled Reports**: Automatic generation on daily, weekly, monthly, or yearly basis
- **Email Delivery**: Automatic email delivery to configured recipients
- **Customization**: Logo, signature, language (English/Arabic/Bilingual), paper size, orientation

### Access Control

- **ADMIN**: Full access including scheduled reports
- **MANAGER**: Generate and view reports
- **Other roles**: No access

### API Endpoints

```
GET    /api/reports/list           - List generated reports
POST   /api/reports/generate       - Generate new report
GET    /api/reports/download/:id   - Download report
GET    /api/reports/preview/:id    - Preview report (PDF only)
POST   /api/reports/email          - Email report
DELETE /api/reports/:id            - Delete report
GET    /api/reports/schedules      - List scheduled reports
POST   /api/reports/schedules      - Create schedule (ADMIN only)
PUT    /api/reports/schedules/:id  - Update schedule (ADMIN only)
DELETE /api/reports/schedules/:id  - Delete schedule (ADMIN only)
```

### Report Generation Example

```typescript
import { ReportService } from '@/services/report';

const reportService = new ReportService();

const report = await reportService.generateReport({
  type: 'MONTHLY_INVENTORY',
  dateRange: {
    from: new Date('2024-10-01'),
    to: new Date('2024-10-31'),
  },
  content: {
    summary: true,
    charts: true,
    detailedTable: true,
    aiInsights: true,
  },
  format: 'PDF',
  customization: {
    includeLogo: true,
    includeSignature: true,
    language: 'bilingual',
    paperSize: 'a4',
    orientation: 'portrait',
  },
});
```

### Scheduled Reports

Create scheduled reports for automatic generation:

1. Navigate to Reports page
2. Click "Scheduled Reports" tab
3. Click "Create Schedule"
4. Configure:
   - Schedule name
   - Report type
   - Frequency (daily, weekly, monthly, yearly)
   - Generation time
   - Email recipients
   - Report configuration

## Cron Jobs

The system uses `node-cron` for scheduled tasks:

### 1. Automatic Backup Job

- **Schedule**: Configured time (default: 2:00 AM daily)
- **Function**: Creates automatic backups in configured formats
- **Actions**:
  - Creates backup files
  - Applies retention policies
  - Sends email notifications on success/failure

### 2. Scheduled Reports Job

- **Schedule**: Every hour (checks for due reports)
- **Function**: Executes scheduled report generation
- **Actions**:
  - Finds enabled schedules that are due
  - Generates reports
  - Emails to configured recipients
  - Updates next run time

### 3. Daily Cleanup Job

- **Schedule**: 3:00 AM daily
- **Function**: Cleans up temporary files and old data
- **Actions**:
  - Removes temporary files older than 24 hours
  - Deletes failed backups older than 7 days
  - Optional: Archives old audit logs

### Cron Service Management

```typescript
import { cronService } from '@/services/cron';

// Initialize cron service (called on app startup)
await cronService.initialize();

// Get status
const status = cronService.getStatus();

// Reload backup job (after config change)
await cronService.reloadBackupJob();

// Stop all jobs
cronService.stopAll();
```

### Cron Status API

Check cron job status (ADMIN only):

```
GET /api/cron/status
```

## Deployment Guide

### 1. Pre-Deployment Checklist

- [ ] Set all required environment variables
- [ ] Run configuration validation: `npm run validate:audit-backup`
- [ ] Create backup and report storage directories
- [ ] Configure SMTP for email notifications
- [ ] Generate audit signing secret and backup encryption key
- [ ] Test database connection

### 2. Storage Setup

Create required directories on the server:

```bash
# Create backup storage directory
sudo mkdir -p /var/backups/mais-inventory
sudo chown -R app-user:app-group /var/backups/mais-inventory
sudo chmod 750 /var/backups/mais-inventory

# Create report storage directory
sudo mkdir -p /var/reports/mais-inventory
sudo chown -R app-user:app-group /var/reports/mais-inventory
sudo chmod 750 /var/reports/mais-inventory

# Create temp directory
sudo mkdir -p /tmp/mais-inventory
sudo chown -R app-user:app-group /tmp/mais-inventory
sudo chmod 750 /tmp/mais-inventory
```

### 3. Database Migration

Run Prisma migrations to create required tables:

```bash
npm run db:migrate
```

This will create:
- `AuditLog` table
- `Backup` table
- `Report` table
- `ReportSchedule` table
- `BackupConfig` table

### 4. Initial Configuration

1. Start the application
2. Sign in as ADMIN
3. Navigate to Backup Management
4. Configure automatic backup settings
5. Create initial manual backup
6. Test backup validation and restore (in preview mode)

### 5. Monitoring

Monitor the system using:

- Backup Health Monitor: `/[locale]/backup`
- Audit Statistics Dashboard: `/[locale]/audit`
- Cron Status API: `/api/cron/status` (ADMIN only)
- System logs

## Troubleshooting

### Backup Issues

**Problem**: Automatic backups not running

**Solutions**:
1. Check cron service status: `GET /api/cron/status`
2. Verify `BACKUP_STORAGE_PATH` exists and is writable
3. Check backup configuration is enabled
4. Review application logs for errors

**Problem**: Backup validation fails

**Solutions**:
1. Check file permissions on backup storage
2. Verify backup file is not corrupted
3. Ensure sufficient disk space
4. Try creating a new backup

### Audit Log Issues

**Problem**: Audit entries not appearing

**Solutions**:
1. Verify `AUDIT_SIGNING_SECRET` is set
2. Check database connection
3. Review application logs for errors
4. Ensure user has ADMIN or AUDITOR role

**Problem**: Cannot revert changes

**Solutions**:
1. Verify user has ADMIN role
2. Check that the audit entry is for an UPDATE action on InventoryItem
3. Ensure the inventory item still exists
4. Review application logs for errors

### Report Generation Issues

**Problem**: Report generation fails

**Solutions**:
1. Check `REPORT_STORAGE_PATH` exists and is writable
2. Verify sufficient disk space
3. For AI insights: Check `GEMINI_API_KEY` is valid
4. Review application logs for specific error

**Problem**: Scheduled reports not generating

**Solutions**:
1. Check cron service status
2. Verify schedule is enabled
3. Check next run time is in the future
4. Review application logs for errors

### Email Notification Issues

**Problem**: Email notifications not sending

**Solutions**:
1. Verify SMTP configuration is correct
2. Test SMTP connection manually
3. Check `ADMIN_EMAIL` is set
4. Review application logs for SMTP errors
5. Verify firewall allows outbound SMTP connections

### Storage Issues

**Problem**: Running out of storage space

**Solutions**:
1. Review retention policies and adjust if needed
2. Delete old backups manually (ADMIN only)
3. Delete old reports that are no longer needed
4. Increase `BACKUP_MAX_STORAGE_GB` if appropriate
5. Consider moving to external storage (S3, etc.)

## Security Best Practices

1. **Secrets Management**:
   - Use strong, randomly generated secrets
   - Rotate secrets periodically
   - Never commit secrets to version control

2. **Access Control**:
   - Limit ADMIN role to trusted users
   - Regularly review user permissions
   - Monitor audit logs for suspicious activity

3. **Backup Security**:
   - Enable encryption for sensitive backups
   - Store backups in secure location
   - Test restore procedures regularly
   - Keep backups off-site for disaster recovery

4. **Network Security**:
   - Use HTTPS for all connections
   - Configure firewall rules appropriately
   - Use VPN for remote access to backups

5. **Monitoring**:
   - Set up alerts for backup failures
   - Monitor storage usage
   - Review audit logs regularly
   - Track failed login attempts

## Support

For issues or questions:

1. Check this documentation
2. Review application logs
3. Check the troubleshooting section
4. Contact system administrator

## Version History

- **v1.0.0** (2024-10-18): Initial implementation
  - Audit trail system with cryptographic signing
  - Backup management with encryption
  - Report generation with AI insights
  - Automated cron jobs
  - Comprehensive i18n support (English/Arabic)
