# Production Database Backup Configuration

This guide provides specific instructions for configuring automated database backups in production environments for the Saudi Mais Inventory Management Application.

## Table of Contents

1. [Overview](#overview)
2. [Backup Strategy](#backup-strategy)
3. [Database-Level Backups](#database-level-backups)
4. [Application-Level Backups](#application-level-backups)
5. [Backup Verification](#backup-verification)
6. [Restoration Procedures](#restoration-procedures)
7. [Monitoring and Alerts](#monitoring-and-alerts)
8. [Disaster Recovery](#disaster-recovery)

---

## Overview

A comprehensive backup strategy includes both database-level and application-level backups:

- **Database-Level Backups**: Full PostgreSQL database dumps (infrastructure)
- **Application-Level Backups**: Selective data exports via the application (managed by app)

Both are essential for a complete disaster recovery plan.

---

## Backup Strategy

### Backup Types

1. **Full Database Backup**: Complete PostgreSQL dump
   - Frequency: Daily
   - Retention: 30 days minimum
   - Storage: Off-site (S3, Azure Blob, etc.)

2. **Application Data Backup**: Selective data export
   - Frequency: Daily (automated via cron)
   - Retention: Configurable (30/90/365 days)
   - Storage: Application storage path

3. **Point-in-Time Recovery (PITR)**: Continuous archiving
   - Frequency: Continuous (WAL archiving)
   - Retention: 7-30 days
   - Storage: Off-site

### Retention Policy

```
Daily Backups:    30 days
Weekly Backups:   12 weeks (3 months)
Monthly Backups:  12 months (1 year)
Yearly Backups:   5 years (compliance)
```

---

## Database-Level Backups

### Option 1: Vercel Postgres Backups

Vercel Postgres includes automatic backups:

#### Configuration

1. **Enable Automatic Backups** (enabled by default)
   - Daily backups at 2:00 AM UTC
   - 30-day retention
   - Point-in-time recovery available

2. **Verify Backup Status**
   ```bash
   # Via Vercel Dashboard
   # Navigate to: Storage → Your Database → Backups
   ```

3. **Manual Backup**
   ```bash
   # Via Vercel Dashboard
   # Click "Create Backup" button
   ```

#### Restoration

```bash
# Via Vercel Dashboard:
# 1. Go to Storage → Your Database → Backups
# 2. Select backup to restore
# 3. Click "Restore"
# 4. Confirm restoration

# Note: This creates a new database instance
# You'll need to update DATABASE_URL after restoration
```

### Option 2: AWS RDS Backups

#### Configuration

1. **Enable Automated Backups**
   ```bash
   # Via AWS Console:
   # RDS → Databases → Select DB → Modify
   # Backup retention period: 30 days
   # Backup window: 02:00-03:00 UTC
   # Enable automatic backups: Yes
   ```

2. **Enable Point-in-Time Recovery**
   ```bash
   # Automatically enabled with automated backups
   # Allows restore to any point within retention period
   ```

3. **Create Manual Snapshot**
   ```bash
   # Via AWS CLI
   aws rds create-db-snapshot \
     --db-instance-identifier mais-inventory-prod \
     --db-snapshot-identifier mais-inventory-manual-$(date +%Y%m%d)
   ```

#### Restoration

```bash
# Restore from automated backup
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier mais-inventory-prod \
  --target-db-instance-identifier mais-inventory-restored \
  --restore-time 2024-10-18T10:00:00Z

# Restore from manual snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier mais-inventory-restored \
  --db-snapshot-identifier mais-inventory-manual-20241018
```

### Option 3: Manual pg_dump Backups

For self-hosted or external PostgreSQL:

#### Setup Automated Backups

Create backup script `scripts/backup-database.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/mais-inventory/database"
DATABASE_URL="${DATABASE_URL_DIRECT:-$DATABASE_URL}"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="mais_inventory_${DATE}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
echo "Creating database backup: $BACKUP_FILE"
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/$BACKUP_FILE"

# Verify backup was created
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo "✅ Backup created successfully: $BACKUP_FILE ($SIZE)"
    
    # Create checksum
    sha256sum "$BACKUP_DIR/$BACKUP_FILE" > "$BACKUP_DIR/$BACKUP_FILE.sha256"
    echo "✅ Checksum created"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Clean up old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "mais_inventory_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "mais_inventory_*.sql.gz.sha256" -mtime +$RETENTION_DAYS -delete

# Upload to S3 (optional)
if [ -n "$AWS_S3_BACKUP_BUCKET" ]; then
    echo "Uploading to S3..."
    aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$AWS_S3_BACKUP_BUCKET/database/"
    aws s3 cp "$BACKUP_DIR/$BACKUP_FILE.sha256" "s3://$AWS_S3_BACKUP_BUCKET/database/"
    echo "✅ Uploaded to S3"
fi

echo "✅ Backup process completed"
```

#### Schedule with Cron

```bash
# Edit crontab
crontab -e

# Add daily backup at 2:00 AM
0 2 * * * /path/to/scripts/backup-database.sh >> /var/log/mais-inventory/backup.log 2>&1
```

#### Restoration

```bash
# Restore from backup
gunzip -c /var/backups/mais-inventory/database/mais_inventory_20241018_020000.sql.gz | \
  psql "$DATABASE_URL_DIRECT"

# Verify checksum before restore
sha256sum -c /var/backups/mais-inventory/database/mais_inventory_20241018_020000.sql.gz.sha256
```

---

## Application-Level Backups

The application includes a built-in backup system (see [AUDIT_BACKUP_SYSTEM.md](./AUDIT_BACKUP_SYSTEM.md)).

### Configuration

1. **Set Environment Variables**
   ```bash
   BACKUP_STORAGE_PATH="/var/backups/mais-inventory/app"
   BACKUP_ENCRYPTION_KEY="your-encryption-key-here"
   BACKUP_MAX_STORAGE_GB="100"
   ```

2. **Configure Automatic Backups**
   - Navigate to `/[locale]/backup` in the application
   - Click "Edit" in Automatic Backup Configuration
   - Enable automatic backups
   - Set schedule time (e.g., 3:00 AM - after database backup)
   - Select formats: JSON (recommended), CSV, SQL
   - Enable "Include Audit Logs"
   - Set retention policies:
     - Daily: 30 days
     - Weekly: 12 weeks
     - Monthly: 12 months

3. **Verify Backup Job**
   ```bash
   # Check cron status
   curl https://your-app.vercel.app/api/cron/status \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

### Manual Backup

```bash
# Via API
curl -X POST https://your-app.vercel.app/api/backup/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "pre-migration-backup",
    "format": "JSON",
    "includeAuditLogs": true,
    "includeUserData": true,
    "includeSettings": true,
    "encrypted": true
  }'
```

---

## Backup Verification

### Automated Verification

Create verification script `scripts/verify-backups.ts`:

```typescript
#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as crypto from 'crypto';

async function verifyDatabaseBackup(backupPath: string) {
  console.log(`🔍 Verifying database backup: ${backupPath}`);
  
  // Check file exists
  if (!fs.existsSync(backupPath)) {
    console.error('❌ Backup file not found');
    return false;
  }
  
  // Check file size
  const stats = fs.statSync(backupPath);
  if (stats.size === 0) {
    console.error('❌ Backup file is empty');
    return false;
  }
  
  console.log(`✅ File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
  // Verify checksum
  const checksumPath = `${backupPath}.sha256`;
  if (fs.existsSync(checksumPath)) {
    const expectedChecksum = fs.readFileSync(checksumPath, 'utf-8').split(' ')[0];
    const fileBuffer = fs.readFileSync(backupPath);
    const actualChecksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    if (expectedChecksum === actualChecksum) {
      console.log('✅ Checksum verified');
    } else {
      console.error('❌ Checksum mismatch');
      return false;
    }
  }
  
  // Test restore to temporary database (optional)
  // This would require creating a temp database and restoring
  
  console.log('✅ Backup verification passed');
  return true;
}

async function verifyApplicationBackup(backupId: string) {
  console.log(`🔍 Verifying application backup: ${backupId}`);
  
  const prisma = new PrismaClient();
  
  try {
    const backup = await prisma.backup.findUnique({
      where: { id: backupId }
    });
    
    if (!backup) {
      console.error('❌ Backup not found in database');
      return false;
    }
    
    // Check file exists
    if (!fs.existsSync(backup.filename)) {
      console.error('❌ Backup file not found on disk');
      return false;
    }
    
    // Verify checksum
    const fileBuffer = fs.readFileSync(backup.filename);
    const actualChecksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    if (backup.checksum === actualChecksum) {
      console.log('✅ Checksum verified');
    } else {
      console.error('❌ Checksum mismatch');
      return false;
    }
    
    console.log('✅ Application backup verification passed');
    return true;
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
const backupPath = process.argv[2];
if (backupPath) {
  verifyDatabaseBackup(backupPath);
} else {
  console.error('Usage: npx tsx scripts/verify-backups.ts <backup-path>');
}
```

### Schedule Regular Verification

```bash
# Add to crontab - verify backups weekly
0 4 * * 0 /path/to/scripts/verify-backups.sh >> /var/log/mais-inventory/verify.log 2>&1
```

---

## Restoration Procedures

### Full System Restoration

#### Step 1: Restore Database

```bash
# 1. Stop application (enable maintenance mode)
# 2. Create new database or drop existing
dropdb mais_inventory_prod
createdb mais_inventory_prod

# 3. Restore from backup
gunzip -c /var/backups/database/mais_inventory_20241018.sql.gz | \
  psql "$DATABASE_URL_DIRECT"

# 4. Verify restoration
psql "$DATABASE_URL_DIRECT" -c "SELECT COUNT(*) FROM users;"
psql "$DATABASE_URL_DIRECT" -c "SELECT COUNT(*) FROM inventory_items;"
```

#### Step 2: Verify Application

```bash
# 1. Run database connection test
npm run test:db

# 2. Check migration status
npm run migrate:status

# 3. Start application
# 4. Test critical functionality
```

#### Step 3: Restore Application Data (if needed)

```bash
# Via application UI:
# 1. Navigate to /[locale]/backup
# 2. Find backup to restore
# 3. Click "Restore"
# 4. Select restore mode (Preview/Merge/Full)
# 5. Confirm restoration
```

### Partial Restoration

For restoring specific data:

```sql
-- Restore specific table from backup
pg_restore -d mais_inventory_prod \
  --table=inventory_items \
  /var/backups/database/mais_inventory_20241018.dump

-- Restore specific records
COPY inventory_items FROM '/path/to/backup.csv' WITH CSV HEADER;
```

---

## Monitoring and Alerts

### Backup Monitoring

Create monitoring script `scripts/monitor-backups.ts`:

```typescript
#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

async function checkBackupHealth() {
  const prisma = new PrismaClient();
  const issues: string[] = [];
  
  try {
    // Check for recent database backup
    const backupDir = '/var/backups/mais-inventory/database';
    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.sql.gz'))
      .map(f => ({
        name: f,
        mtime: fs.statSync(`${backupDir}/${f}`).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    
    if (files.length === 0) {
      issues.push('No database backups found');
    } else {
      const latestBackup = files[0];
      const hoursSinceBackup = (Date.now() - latestBackup.mtime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceBackup > 26) {
        issues.push(`Latest database backup is ${hoursSinceBackup.toFixed(1)} hours old`);
      }
    }
    
    // Check for recent application backup
    const recentAppBackup = await prisma.backup.findFirst({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(Date.now() - 26 * 60 * 60 * 1000) // 26 hours
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!recentAppBackup) {
      issues.push('No recent application backup found');
    }
    
    // Check storage space
    const stats = fs.statSync(backupDir);
    // Add disk space check logic here
    
    // Report issues
    if (issues.length > 0) {
      console.error('❌ Backup health check failed:');
      issues.forEach(issue => console.error(`  - ${issue}`));
      
      // Send alert email
      // await sendAlertEmail(issues);
      
      process.exit(1);
    } else {
      console.log('✅ Backup health check passed');
      process.exit(0);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkBackupHealth();
```

### Alert Configuration

Configure alerts for:

1. **Backup Failures**
   - No backup in last 26 hours
   - Backup job failed
   - Backup verification failed

2. **Storage Issues**
   - Disk space > 80% full
   - Backup size unusually small
   - Backup size unusually large

3. **Restoration Issues**
   - Restoration failed
   - Data integrity check failed

### Alert Channels

- Email notifications (via SMTP)
- Slack webhooks
- PagerDuty integration
- Vercel monitoring alerts

---

## Disaster Recovery

### Recovery Time Objective (RTO)

Target time to restore service: **4 hours**

### Recovery Point Objective (RPO)

Maximum acceptable data loss: **24 hours**

### Disaster Recovery Plan

#### Scenario 1: Database Corruption

```
1. Identify corruption (2 hours)
   - Monitor alerts
   - Verify issue
   - Assess impact

2. Restore from backup (1 hour)
   - Select appropriate backup
   - Restore database
   - Verify data integrity

3. Resume operations (1 hour)
   - Start application
   - Run smoke tests
   - Monitor for issues
```

#### Scenario 2: Complete Data Loss

```
1. Provision new infrastructure (1 hour)
   - Create new database
   - Deploy application

2. Restore from backups (2 hours)
   - Restore database backup
   - Restore application data
   - Verify restoration

3. Resume operations (1 hour)
   - Configure DNS
   - Run comprehensive tests
   - Monitor closely
```

#### Scenario 3: Regional Outage

```
1. Failover to backup region (30 minutes)
   - Update DNS
   - Route traffic

2. Restore data in new region (2 hours)
   - Restore from off-site backup
   - Verify data integrity

3. Resume operations (1.5 hours)
   - Run comprehensive tests
   - Monitor performance
   - Communicate with users
```

### DR Testing Schedule

- **Monthly**: Backup verification
- **Quarterly**: Partial restoration test
- **Annually**: Full DR drill

---

## Best Practices

1. **3-2-1 Backup Rule**
   - 3 copies of data
   - 2 different storage types
   - 1 off-site backup

2. **Test Restorations Regularly**
   - Monthly verification
   - Quarterly full restoration test
   - Document restoration time

3. **Encrypt Backups**
   - Use strong encryption (AES-256)
   - Secure key management
   - Rotate encryption keys annually

4. **Monitor Backup Health**
   - Automated monitoring
   - Alert on failures
   - Track backup metrics

5. **Document Procedures**
   - Keep runbooks updated
   - Document lessons learned
   - Train team on procedures

6. **Secure Backup Storage**
   - Restrict access
   - Use separate credentials
   - Enable audit logging

---

## Checklist

### Initial Setup
- [ ] Configure database-level backups
- [ ] Configure application-level backups
- [ ] Set up off-site backup storage
- [ ] Configure backup encryption
- [ ] Set up monitoring and alerts
- [ ] Document restoration procedures
- [ ] Test backup restoration

### Regular Maintenance
- [ ] Verify backups weekly
- [ ] Test restoration monthly
- [ ] Review retention policies quarterly
- [ ] Update documentation as needed
- [ ] Rotate encryption keys annually
- [ ] Conduct DR drill annually

### Before Major Changes
- [ ] Create manual backup
- [ ] Verify backup integrity
- [ ] Document rollback procedure
- [ ] Test restoration in staging
- [ ] Notify team of backup status

---

## Additional Resources

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [AWS RDS Backup Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_CommonTasks.BackupRestore.html)
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Application Backup System](./AUDIT_BACKUP_SYSTEM.md)
- [Database Migration Guide](./DATABASE_MIGRATIONS.md)
