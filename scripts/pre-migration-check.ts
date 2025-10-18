#!/usr/bin/env tsx

/**
 * Pre-Migration Safety Check Script
 * 
 * This script performs safety checks before running database migrations in production.
 * It verifies that the system is ready for migration and identifies potential issues.
 * 
 * Usage:
 *   npm run pre-migration-check
 *   or
 *   npx tsx scripts/pre-migration-check.ts
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: string;
}

const checks: CheckResult[] = [];

function addCheck(result: CheckResult) {
  checks.push(result);
  const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
  console.log(`${icon} ${result.name}: ${result.message}`);
  if (result.details) {
    console.log(`   ${result.details}`);
  }
}

async function checkEnvironmentVariables() {
  console.log('\n📋 Checking Environment Variables...\n');
  
  // Check DATABASE_URL
  if (process.env.DATABASE_URL) {
    addCheck({
      name: 'DATABASE_URL',
      status: 'pass',
      message: 'Set'
    });
  } else {
    addCheck({
      name: 'DATABASE_URL',
      status: 'fail',
      message: 'Not set',
      details: 'DATABASE_URL environment variable is required'
    });
  }
  
  // Check DATABASE_URL_DIRECT
  if (process.env.DATABASE_URL_DIRECT) {
    addCheck({
      name: 'DATABASE_URL_DIRECT',
      status: 'pass',
      message: 'Set (recommended for migrations)'
    });
  } else {
    addCheck({
      name: 'DATABASE_URL_DIRECT',
      status: 'warn',
      message: 'Not set',
      details: 'Using DATABASE_URL for migrations (may have connection pooling issues)'
    });
  }
  
  // Check NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    addCheck({
      name: 'NODE_ENV',
      status: 'pass',
      message: 'Production mode'
    });
  } else {
    addCheck({
      name: 'NODE_ENV',
      status: 'warn',
      message: `Set to ${process.env.NODE_ENV || 'undefined'}`,
      details: 'Not in production mode - ensure this is intentional'
    });
  }
}

async function checkDatabaseConnection() {
  console.log('\n🔌 Checking Database Connection...\n');
  
  const databaseUrl = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    addCheck({
      name: 'Database Connection',
      status: 'fail',
      message: 'Cannot test - no DATABASE_URL set'
    });
    return;
  }
  
  const prisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrl }
    }
  });
  
  try {
    await prisma.$connect();
    addCheck({
      name: 'Database Connection',
      status: 'pass',
      message: 'Connected successfully'
    });
    
    // Check PostgreSQL version
    const result = await prisma.$queryRaw<Array<{ version: string }>>`
      SELECT version()
    `;
    
    if (result && result[0]) {
      const version = result[0].version.split(' ')[1];
      addCheck({
        name: 'PostgreSQL Version',
        status: 'pass',
        message: version
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    addCheck({
      name: 'Database Connection',
      status: 'fail',
      message: 'Failed to connect',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function checkMigrationStatus() {
  console.log('\n📊 Checking Migration Status...\n');
  
  const databaseUrl = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    addCheck({
      name: 'Migration Status',
      status: 'fail',
      message: 'Cannot check - no DATABASE_URL set'
    });
    return;
  }
  
  try {
    const status = execSync('npx prisma migrate status', {
      encoding: 'utf-8',
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    if (status.includes('Database schema is up to date')) {
      addCheck({
        name: 'Migration Status',
        status: 'pass',
        message: 'No pending migrations'
      });
    } else if (status.includes('following migration have not yet been applied')) {
      const pendingCount = (status.match(/\d+_/g) || []).length;
      addCheck({
        name: 'Migration Status',
        status: 'warn',
        message: `${pendingCount} pending migration(s)`,
        details: 'Migrations will be applied during deployment'
      });
    } else {
      addCheck({
        name: 'Migration Status',
        status: 'warn',
        message: 'Unknown status',
        details: status.substring(0, 100)
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('following migration have not yet been applied')) {
      addCheck({
        name: 'Migration Status',
        status: 'warn',
        message: 'Pending migrations detected',
        details: 'Migrations will be applied during deployment'
      });
    } else {
      addCheck({
        name: 'Migration Status',
        status: 'fail',
        message: 'Failed to check status',
        details: errorMessage.substring(0, 200)
      });
    }
  }
}

async function checkPrismaSchema() {
  console.log('\n📝 Checking Prisma Schema...\n');
  
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  
  if (fs.existsSync(schemaPath)) {
    addCheck({
      name: 'Prisma Schema',
      status: 'pass',
      message: 'Found at prisma/schema.prisma'
    });
    
    // Check if schema is valid
    try {
      execSync('npx prisma validate', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      addCheck({
        name: 'Schema Validation',
        status: 'pass',
        message: 'Schema is valid'
      });
    } catch (error) {
      addCheck({
        name: 'Schema Validation',
        status: 'fail',
        message: 'Schema validation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    addCheck({
      name: 'Prisma Schema',
      status: 'fail',
      message: 'Not found',
      details: 'Expected at prisma/schema.prisma'
    });
  }
}

async function checkMigrationFiles() {
  console.log('\n📁 Checking Migration Files...\n');
  
  const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
  
  if (fs.existsSync(migrationsPath)) {
    const migrations = fs.readdirSync(migrationsPath)
      .filter(file => file !== 'migration_lock.toml')
      .filter(file => fs.statSync(path.join(migrationsPath, file)).isDirectory());
    
    addCheck({
      name: 'Migration Files',
      status: 'pass',
      message: `Found ${migrations.length} migration(s)`
    });
    
    // Check latest migration
    if (migrations.length > 0) {
      const latestMigration = migrations[migrations.length - 1];
      addCheck({
        name: 'Latest Migration',
        status: 'pass',
        message: latestMigration
      });
    }
  } else {
    addCheck({
      name: 'Migration Files',
      status: 'warn',
      message: 'No migrations directory found',
      details: 'This might be the first migration'
    });
  }
}

async function checkDiskSpace() {
  console.log('\n💾 Checking Disk Space...\n');
  
  try {
    // This is a simple check - in production, you'd want more sophisticated monitoring
    const df = execSync('df -h .', { encoding: 'utf-8' });
    const lines = df.split('\n');
    
    if (lines.length > 1) {
      const parts = lines[1].split(/\s+/);
      const usedPercent = parseInt(parts[4]);
      
      if (usedPercent < 80) {
        addCheck({
          name: 'Disk Space',
          status: 'pass',
          message: `${100 - usedPercent}% available`
        });
      } else if (usedPercent < 90) {
        addCheck({
          name: 'Disk Space',
          status: 'warn',
          message: `${100 - usedPercent}% available`,
          details: 'Disk space is getting low'
        });
      } else {
        addCheck({
          name: 'Disk Space',
          status: 'fail',
          message: `Only ${100 - usedPercent}% available`,
          details: 'Critical: Disk space is very low'
        });
      }
    }
  } catch (error) {
    addCheck({
      name: 'Disk Space',
      status: 'warn',
      message: 'Could not check',
      details: 'Disk space check not available on this system'
    });
  }
}

async function checkBackupStatus() {
  console.log('\n💼 Checking Backup Status...\n');
  
  const databaseUrl = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    addCheck({
      name: 'Recent Backup',
      status: 'warn',
      message: 'Cannot verify - no DATABASE_URL set'
    });
    return;
  }
  
  const prisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrl }
    }
  });
  
  try {
    await prisma.$connect();
    
    // Check if backup table exists
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'backups'
    `;
    
    if (tables && tables.length > 0) {
      // Check for recent backups
      const recentBackups = await prisma.backup.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      });
      
      if (recentBackups.length > 0) {
        const backup = recentBackups[0];
        const hoursAgo = Math.floor((Date.now() - backup.createdAt.getTime()) / (1000 * 60 * 60));
        addCheck({
          name: 'Recent Backup',
          status: 'pass',
          message: `Found backup from ${hoursAgo} hour(s) ago`
        });
      } else {
        addCheck({
          name: 'Recent Backup',
          status: 'warn',
          message: 'No backup in last 24 hours',
          details: 'Consider creating a backup before migration'
        });
      }
    } else {
      addCheck({
        name: 'Recent Backup',
        status: 'warn',
        message: 'Backup table not found',
        details: 'Cannot verify backup status'
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    addCheck({
      name: 'Recent Backup',
      status: 'warn',
      message: 'Could not check backup status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function runAllChecks() {
  console.log('🔍 Pre-Migration Safety Checks');
  console.log('═'.repeat(60));
  
  await checkEnvironmentVariables();
  await checkDatabaseConnection();
  await checkPrismaSchema();
  await checkMigrationFiles();
  await checkMigrationStatus();
  await checkBackupStatus();
  await checkDiskSpace();
  
  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Summary\n');
  
  const passed = checks.filter(c => c.status === 'pass').length;
  const warned = checks.filter(c => c.status === 'warn').length;
  const failed = checks.filter(c => c.status === 'fail').length;
  
  console.log(`Total Checks: ${checks.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings: ${warned}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ CRITICAL: Some checks failed. Do NOT proceed with migration.');
    console.log('\nFailed Checks:');
    checks
      .filter(c => c.status === 'fail')
      .forEach(c => {
        console.log(`  • ${c.name}: ${c.message}`);
        if (c.details) {
          console.log(`    ${c.details}`);
        }
      });
    process.exit(1);
  } else if (warned > 0) {
    console.log('\n⚠️  WARNING: Some checks have warnings. Review before proceeding.');
    console.log('\nWarnings:');
    checks
      .filter(c => c.status === 'warn')
      .forEach(c => {
        console.log(`  • ${c.name}: ${c.message}`);
        if (c.details) {
          console.log(`    ${c.details}`);
        }
      });
    console.log('\n⚠️  Proceed with caution. Ensure you have a rollback plan.');
    process.exit(0);
  } else {
    console.log('\n✅ All checks passed! Safe to proceed with migration.');
    console.log('\n📋 Pre-Migration Checklist:');
    console.log('  1. ✅ Environment variables configured');
    console.log('  2. ✅ Database connection verified');
    console.log('  3. ✅ Schema validated');
    console.log('  4. ✅ Migration files present');
    console.log('  5. ⚠️  Ensure recent backup exists');
    console.log('  6. ⚠️  Notify team of migration');
    console.log('  7. ⚠️  Have rollback plan ready');
    console.log('\n🚀 Ready to run: npx prisma migrate deploy');
    process.exit(0);
  }
}

// Run all checks
runAllChecks().catch((error) => {
  console.error('\n❌ Fatal error during pre-migration checks:', error);
  process.exit(1);
});
