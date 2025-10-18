# Database Migration Strategy

This document outlines the strategy and procedures for managing database migrations in production for the Saudi Mais Inventory Management Application.

## Table of Contents

1. [Overview](#overview)
2. [Migration Workflow](#migration-workflow)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Running Migrations](#running-migrations)
5. [Rollback Procedures](#rollback-procedures)
6. [Testing Migrations](#testing-migrations)
7. [Common Scenarios](#common-scenarios)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### Migration Philosophy

- **Safety First**: Always test migrations in staging before production
- **Backward Compatible**: Migrations should not break existing deployments
- **Reversible**: Always have a rollback plan
- **Zero Downtime**: Design migrations to minimize or eliminate downtime
- **Documented**: Every migration should be documented and reviewed

### Migration Types

1. **Additive Migrations**: Add new tables, columns, indexes (safe)
2. **Transformative Migrations**: Modify existing data (requires care)
3. **Destructive Migrations**: Remove tables, columns (dangerous)

---

## Migration Workflow

### Development Phase

```mermaid
graph LR
    A[Schema Change] --> B[Create Migration]
    B --> C[Test Locally]
    C --> D[Code Review]
    D --> E[Merge to Main]
```

1. **Make Schema Changes**
   ```bash
   # Edit prisma/schema.prisma
   # Add/modify models, fields, etc.
   ```

2. **Create Migration**
   ```bash
   # Create a new migration
   npx prisma migrate dev --name descriptive_migration_name
   
   # Example names:
   # - add_user_preferences_column
   # - create_audit_log_indexes
   # - rename_batch_to_batch_number
   ```

3. **Review Generated SQL**
   ```bash
   # Check the generated migration file
   cat prisma/migrations/YYYYMMDDHHMMSS_migration_name/migration.sql
   ```

4. **Test Locally**
   ```bash
   # Reset database and test migration
   npx prisma migrate reset
   npx prisma migrate dev
   
   # Verify application works
   npm run dev
   ```

5. **Commit Migration**
   ```bash
   git add prisma/schema.prisma
   git add prisma/migrations/
   git commit -m "feat: add user preferences column"
   ```

### Staging Phase

```mermaid
graph LR
    A[Deploy to Staging] --> B[Run Migrations]
    B --> C[Smoke Tests]
    C --> D[QA Testing]
    D --> E{Pass?}
    E -->|Yes| F[Approve for Prod]
    E -->|No| G[Fix Issues]
    G --> A
```

1. **Deploy to Staging**
   ```bash
   # Automatic via CI/CD on PR merge to staging branch
   ```

2. **Run Migrations in Staging**
   ```bash
   # Migrations run automatically in build process
   # Or manually:
   DATABASE_URL=$STAGING_DATABASE_URL npx prisma migrate deploy
   ```

3. **Verify Migration**
   ```bash
   # Check migration status
   DATABASE_URL=$STAGING_DATABASE_URL npx prisma migrate status
   
   # Test application
   curl https://staging.yourdomain.com/api/health/db
   ```

4. **QA Testing**
   - Test all affected features
   - Verify data integrity
   - Check performance
   - Test rollback procedure

### Production Phase

```mermaid
graph LR
    A[Backup Database] --> B[Run Migration]
    B --> C[Verify Success]
    C --> D[Deploy Application]
    D --> E[Smoke Tests]
    E --> F{Success?}
    F -->|Yes| G[Monitor]
    F -->|No| H[Rollback]
```

1. **Pre-Deployment Backup**
   ```bash
   # Automatic backup before migration
   # Or manual backup
   ```

2. **Run Migration**
   ```bash
   # Use direct database connection (not pooled)
   DATABASE_URL=$DATABASE_URL_DIRECT npx prisma migrate deploy
   ```

3. **Verify Migration**
   ```bash
   # Check migration status
   DATABASE_URL=$DATABASE_URL_DIRECT npx prisma migrate status
   ```

4. **Deploy Application**
   ```bash
   # Automatic via CI/CD
   # Vercel will deploy after successful build
   ```

5. **Post-Deployment Verification**
   ```bash
   # Test critical endpoints
   curl https://yourdomain.com/api/health/db
   
   # Check error logs
   # Monitor performance metrics
   ```

---

## Pre-Deployment Checklist

### Before Running Migrations

- [ ] **Backup Created**: Database backup completed and verified
- [ ] **Staging Tested**: Migration tested successfully in staging
- [ ] **Review Completed**: Migration SQL reviewed and approved
- [ ] **Rollback Plan**: Rollback procedure documented and tested
- [ ] **Downtime Window**: Maintenance window scheduled (if needed)
- [ ] **Team Notified**: Team aware of deployment and potential impact
- [ ] **Monitoring Ready**: Monitoring and alerting configured
- [ ] **Direct Connection**: Using `DATABASE_URL_DIRECT` for migration

### Migration Safety Checks

```bash
# Run this script before production migration
npx tsx scripts/pre-migration-check.ts
```

Create `scripts/pre-migration-check.ts`:

```typescript
#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

async function preMigrationCheck() {
  console.log('🔍 Pre-Migration Safety Checks\n');
  
  const checks = [];
  
  // Check 1: Pending migrations
  try {
    const status = execSync('npx prisma migrate status', { 
      encoding: 'utf-8',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_DIRECT }
    });
    
    if (status.includes('Database schema is up to date')) {
      checks.push({ name: 'Pending Migrations', status: 'pass', message: 'No pending migrations' });
    } else {
      checks.push({ name: 'Pending Migrations', status: 'warn', message: 'Migrations pending' });
    }
  } catch (error) {
    checks.push({ name: 'Pending Migrations', status: 'fail', message: 'Failed to check status' });
  }
  
  // Check 2: Database connection
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL_DIRECT } }
  });
  
  try {
    await prisma.$connect();
    checks.push({ name: 'Database Connection', status: 'pass', message: 'Connected' });
  } catch (error) {
    checks.push({ name: 'Database Connection', status: 'fail', message: 'Cannot connect' });
  }
  
  // Check 3: Backup exists
  // Add your backup verification logic here
  
  // Check 4: Disk space
  // Add disk space check
  
  // Print results
  checks.forEach(check => {
    const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
    console.log(`${icon} ${check.name}: ${check.message}`);
  });
  
  const failed = checks.filter(c => c.status === 'fail').length;
  if (failed > 0) {
    console.log('\n❌ Pre-migration checks failed. Do not proceed with migration.');
    process.exit(1);
  }
  
  console.log('\n✅ All pre-migration checks passed. Safe to proceed.');
  await prisma.$disconnect();
}

preMigrationCheck();
```

---

## Running Migrations

### Automatic Migration (Recommended)

Migrations run automatically during the build process via GitHub Actions:

```yaml
# .github/workflows/deploy.yml
- name: Run database migrations
  run: npx prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL_DIRECT }}
```

### Manual Migration

If you need to run migrations manually:

```bash
# 1. Set environment variable
export DATABASE_URL=$DATABASE_URL_DIRECT

# 2. Check current status
npx prisma migrate status

# 3. Run pending migrations
npx prisma migrate deploy

# 4. Verify success
npx prisma migrate status
```

### Migration with Downtime

For migrations that require downtime:

```bash
# 1. Enable maintenance mode
# (Deploy maintenance page or use Vercel maintenance mode)

# 2. Wait for active connections to close
# Monitor active connections

# 3. Run migration
DATABASE_URL=$DATABASE_URL_DIRECT npx prisma migrate deploy

# 4. Verify migration
DATABASE_URL=$DATABASE_URL_DIRECT npx prisma migrate status

# 5. Deploy new application version
# Via CI/CD or manual deployment

# 6. Disable maintenance mode
# Remove maintenance page

# 7. Monitor for errors
# Check logs and metrics
```

### Zero-Downtime Migration

For large tables or complex migrations:

```bash
# Phase 1: Add new column (nullable)
# Deploy migration
npx prisma migrate deploy

# Phase 2: Backfill data
# Run data migration script
npx tsx scripts/backfill-data.ts

# Phase 3: Make column required
# Deploy second migration
npx prisma migrate deploy

# Phase 4: Remove old column
# Deploy final migration
npx prisma migrate deploy
```

---

## Rollback Procedures

### Automatic Rollback (Application)

Vercel allows instant rollback of application code:

```bash
# Via Vercel Dashboard:
# 1. Go to Deployments
# 2. Find previous working deployment
# 3. Click "Promote to Production"

# Via Vercel CLI:
vercel rollback
```

### Database Migration Rollback

**Important**: Prisma doesn't support automatic migration rollback. You must manually revert.

#### Option 1: Restore from Backup

```bash
# 1. Stop application (enable maintenance mode)

# 2. Restore database from backup
# (See backup restoration procedure)

# 3. Rollback application code
vercel rollback

# 4. Verify system
npm run test:db

# 5. Resume normal operations
```

#### Option 2: Manual Rollback Migration

```bash
# 1. Create rollback SQL script
# Example: prisma/migrations/rollback_YYYYMMDDHHMMSS.sql

# 2. Review rollback script carefully
cat prisma/migrations/rollback_YYYYMMDDHHMMSS.sql

# 3. Apply rollback
psql $DATABASE_URL_DIRECT -f prisma/migrations/rollback_YYYYMMDDHHMMSS.sql

# 4. Update migration history
# Mark migration as rolled back in _prisma_migrations table

# 5. Rollback application code
vercel rollback

# 6. Verify system
npm run test:db
```

#### Example Rollback Scripts

**Adding a column (rollback):**
```sql
-- Rollback for: add_user_preferences_column
ALTER TABLE users DROP COLUMN IF EXISTS preferences;
```

**Renaming a column (rollback):**
```sql
-- Rollback for: rename_batch_to_batch_number
ALTER TABLE inventory_items RENAME COLUMN batch_number TO batch;
```

**Creating a table (rollback):**
```sql
-- Rollback for: create_audit_logs_table
DROP TABLE IF EXISTS audit_logs CASCADE;
```

### Rollback Decision Tree

```
Migration Failed?
├─ Yes
│  ├─ Data Corrupted?
│  │  ├─ Yes → Restore from Backup
│  │  └─ No → Manual Rollback SQL
│  └─ Application Error?
│     └─ Rollback Application Only
└─ No → Continue Monitoring
```

---

## Testing Migrations

### Local Testing

```bash
# 1. Create test database
createdb mais_inventory_test

# 2. Set test database URL
export DATABASE_URL="postgresql://user:pass@localhost:5432/mais_inventory_test"

# 3. Run migrations
npx prisma migrate deploy

# 4. Seed test data
npx prisma db seed

# 5. Test application
npm run dev

# 6. Verify data integrity
npm run test:db

# 7. Clean up
dropdb mais_inventory_test
```

### Staging Testing

```bash
# 1. Deploy to staging
git push origin staging

# 2. Wait for deployment

# 3. Run smoke tests
npm run test:staging

# 4. Manual QA testing
# - Test all CRUD operations
# - Verify data integrity
# - Check performance
# - Test edge cases

# 5. Test rollback procedure
# - Restore from backup
# - Verify data consistency
```

### Performance Testing

```bash
# Test migration performance on production-sized data
# 1. Create staging database with production data volume
# 2. Time the migration
time DATABASE_URL=$STAGING_DATABASE_URL npx prisma migrate deploy

# 3. Check for locks
# 4. Monitor resource usage
# 5. Verify query performance after migration
```

---

## Common Scenarios

### Scenario 1: Adding a New Column

**Safe Approach:**

```prisma
// Step 1: Add nullable column
model User {
  id          String   @id
  email       String
  preferences Json?    // New optional column
}
```

```bash
npx prisma migrate dev --name add_user_preferences
npx prisma migrate deploy
```

**Rollback:**
```sql
ALTER TABLE users DROP COLUMN preferences;
```

### Scenario 2: Renaming a Column

**Safe Approach (Zero Downtime):**

```prisma
// Step 1: Add new column
model InventoryItem {
  batch       String  // Old column
  batchNumber String? // New column
}

// Step 2: Backfill data
// Run: UPDATE inventory_items SET batch_number = batch;

// Step 3: Make new column required
model InventoryItem {
  batch       String  // Old column (deprecated)
  batchNumber String  // New column
}

// Step 4: Update application to use new column

// Step 5: Remove old column
model InventoryItem {
  batchNumber String
}
```

### Scenario 3: Adding an Index

**Safe Approach:**

```prisma
model InventoryItem {
  itemName String
  batch    String
  
  @@index([itemName, batch]) // New index
}
```

```bash
# Create migration
npx prisma migrate dev --name add_inventory_item_index

# For large tables, create index concurrently (manual SQL)
CREATE INDEX CONCURRENTLY idx_inventory_items_name_batch 
ON inventory_items(item_name, batch);
```

### Scenario 4: Changing Column Type

**Risky - Requires Careful Planning:**

```prisma
// Before: quantity Int
// After: quantity Decimal

// Step 1: Add new column
model InventoryItem {
  quantity       Int
  quantityDecimal Decimal?
}

// Step 2: Backfill
// UPDATE inventory_items SET quantity_decimal = quantity::decimal;

// Step 3: Switch application to use new column

// Step 4: Remove old column
model InventoryItem {
  quantity Decimal
}
```

### Scenario 5: Removing a Column

**Safe Approach:**

```prisma
// Step 1: Make column optional in code (don't use it)
// Deploy application

// Step 2: Wait 24-48 hours (ensure no usage)

// Step 3: Remove from schema
model User {
  // oldColumn removed
}

// Step 4: Deploy migration
```

---

## Troubleshooting

### Migration Fails with "relation already exists"

**Cause**: Migration was partially applied

**Solution**:
```bash
# Check migration status
npx prisma migrate status

# Resolve migration
npx prisma migrate resolve --applied MIGRATION_NAME

# Or mark as rolled back
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

### Migration Hangs

**Cause**: Table lock or long-running query

**Solution**:
```sql
-- Check for locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Check active queries
SELECT pid, query, state, query_start 
FROM pg_stat_activity 
WHERE state != 'idle';

-- Kill blocking query (if safe)
SELECT pg_terminate_backend(pid);
```

### Migration Fails with Permission Error

**Cause**: Database user lacks necessary permissions

**Solution**:
```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE mais_inventory TO mais_app;
GRANT ALL ON SCHEMA public TO mais_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mais_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mais_app;
```

### Out of Sync Schema

**Cause**: Manual changes to database

**Solution**:
```bash
# Pull current database schema
npx prisma db pull

# Review changes
git diff prisma/schema.prisma

# Create migration to match
npx prisma migrate dev --name sync_schema

# Or reset (DESTRUCTIVE)
npx prisma migrate reset
```

---

## Best Practices

1. **Always Test First**: Test migrations in staging before production
2. **Use Descriptive Names**: Migration names should clearly describe the change
3. **Keep Migrations Small**: Smaller migrations are easier to rollback
4. **Document Complex Migrations**: Add comments explaining the purpose
5. **Backup Before Migrating**: Always have a recent backup
6. **Monitor After Migration**: Watch for errors and performance issues
7. **Use Transactions**: Wrap multiple changes in transactions when possible
8. **Avoid Peak Hours**: Run migrations during low-traffic periods
9. **Have a Rollback Plan**: Know how to revert before you start
10. **Communicate**: Inform team about migrations and potential impact

---

## Additional Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Zero-Downtime Migrations](https://www.braintreepayments.com/blog/safe-operations-for-high-volume-postgresql/)
- [Database Backup Guide](./AUDIT_BACKUP_SYSTEM.md)

---

## Migration Checklist Template

```markdown
## Migration: [MIGRATION_NAME]

### Pre-Migration
- [ ] Backup created and verified
- [ ] Tested in staging
- [ ] Rollback procedure documented
- [ ] Team notified
- [ ] Maintenance window scheduled (if needed)

### Migration
- [ ] Pre-migration checks passed
- [ ] Migration executed successfully
- [ ] Migration status verified
- [ ] Application deployed
- [ ] Smoke tests passed

### Post-Migration
- [ ] No errors in logs
- [ ] Performance metrics normal
- [ ] Data integrity verified
- [ ] Monitoring active
- [ ] Team notified of completion

### Rollback (if needed)
- [ ] Issue identified
- [ ] Rollback decision made
- [ ] Rollback executed
- [ ] System verified
- [ ] Post-mortem scheduled
```
