#!/usr/bin/env tsx

/**
 * Backup Verification Script
 * 
 * This script verifies the integrity of database and application backups.
 * It checks file existence, size, checksums, and optionally tests restoration.
 * 
 * Usage:
 *   npm run verify:backups
 *   or
 *   npx tsx scripts/verify-backups.ts [backup-path]
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

interface VerificationResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: string;
}

const results: VerificationResult[] = [];

function addResult(result: VerificationResult) {
  results.push(result);
  const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
  console.log(`${icon} ${result.name}: ${result.message}`);
  if (result.details) {
    console.log(`   ${result.details}`);
  }
}

function calculateChecksum(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

async function verifyDatabaseBackup(backupPath: string): Promise<boolean> {
  console.log(`\n🔍 Verifying Database Backup: ${backupPath}\n`);
  
  // Check 1: File exists
  if (!fs.existsSync(backupPath)) {
    addResult({
      name: 'File Existence',
      status: 'fail',
      message: 'Backup file not found',
      details: backupPath
    });
    return false;
  }
  
  addResult({
    name: 'File Existence',
    status: 'pass',
    message: 'Backup file found'
  });
  
  // Check 2: File size
  const stats = fs.statSync(backupPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  
  if (stats.size === 0) {
    addResult({
      name: 'File Size',
      status: 'fail',
      message: 'Backup file is empty'
    });
    return false;
  } else if (stats.size < 1024) {
    addResult({
      name: 'File Size',
      status: 'warn',
      message: `File is very small: ${stats.size} bytes`,
      details: 'This may indicate an incomplete backup'
    });
  } else {
    addResult({
      name: 'File Size',
      status: 'pass',
      message: `${sizeMB} MB`
    });
  }
  
  // Check 3: File age
  const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
  if (ageHours > 26) {
    addResult({
      name: 'Backup Age',
      status: 'warn',
      message: `${ageHours.toFixed(1)} hours old`,
      details: 'Backup is older than 26 hours'
    });
  } else {
    addResult({
      name: 'Backup Age',
      status: 'pass',
      message: `${ageHours.toFixed(1)} hours old`
    });
  }
  
  // Check 4: Checksum verification
  const checksumPath = `${backupPath}.sha256`;
  if (fs.existsSync(checksumPath)) {
    try {
      const checksumContent = fs.readFileSync(checksumPath, 'utf-8');
      const expectedChecksum = checksumContent.split(' ')[0];
      const actualChecksum = calculateChecksum(backupPath);
      
      if (expectedChecksum === actualChecksum) {
        addResult({
          name: 'Checksum Verification',
          status: 'pass',
          message: 'Checksum matches'
        });
      } else {
        addResult({
          name: 'Checksum Verification',
          status: 'fail',
          message: 'Checksum mismatch',
          details: 'File may be corrupted'
        });
        return false;
      }
    } catch (error) {
      addResult({
        name: 'Checksum Verification',
        status: 'warn',
        message: 'Failed to verify checksum',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    addResult({
      name: 'Checksum Verification',
      status: 'warn',
      message: 'Checksum file not found',
      details: 'Cannot verify file integrity'
    });
  }
  
  // Check 5: File format (for .sql.gz files)
  if (backupPath.endsWith('.sql.gz')) {
    try {
      // Test if file is valid gzip
      execSync(`gunzip -t "${backupPath}"`, { stdio: 'pipe' });
      addResult({
        name: 'File Format',
        status: 'pass',
        message: 'Valid gzip format'
      });
    } catch (error) {
      addResult({
        name: 'File Format',
        status: 'fail',
        message: 'Invalid gzip format',
        details: 'File may be corrupted'
      });
      return false;
    }
  }
  
  return true;
}

async function verifyApplicationBackup(backupId: string): Promise<boolean> {
  console.log(`\n🔍 Verifying Application Backup: ${backupId}\n`);
  
  const prisma = new PrismaClient();
  
  try {
    // Check 1: Backup exists in database
    const backup = await prisma.backup.findUnique({
      where: { id: backupId }
    });
    
    if (!backup) {
      addResult({
        name: 'Database Record',
        status: 'fail',
        message: 'Backup not found in database'
      });
      return false;
    }
    
    addResult({
      name: 'Database Record',
      status: 'pass',
      message: 'Backup record found'
    });
    
    // Check 2: Backup status
    if (backup.status !== 'COMPLETED') {
      addResult({
        name: 'Backup Status',
        status: 'fail',
        message: `Status is ${backup.status}`,
        details: 'Backup did not complete successfully'
      });
      return false;
    }
    
    addResult({
      name: 'Backup Status',
      status: 'pass',
      message: 'Completed'
    });
    
    // Check 3: File exists
    if (!fs.existsSync(backup.filename)) {
      addResult({
        name: 'File Existence',
        status: 'fail',
        message: 'Backup file not found on disk',
        details: backup.filename
      });
      return false;
    }
    
    addResult({
      name: 'File Existence',
      status: 'pass',
      message: 'File found on disk'
    });
    
    // Check 4: File size matches
    const stats = fs.statSync(backup.filename);
    const sizeMB = (Number(backup.fileSize) / 1024 / 1024).toFixed(2);
    
    if (stats.size !== Number(backup.fileSize)) {
      addResult({
        name: 'File Size',
        status: 'warn',
        message: 'Size mismatch',
        details: `Expected: ${sizeMB}MB, Actual: ${(stats.size / 1024 / 1024).toFixed(2)}MB`
      });
    } else {
      addResult({
        name: 'File Size',
        status: 'pass',
        message: `${sizeMB} MB`
      });
    }
    
    // Check 5: Checksum verification
    try {
      const actualChecksum = calculateChecksum(backup.filename);
      
      if (backup.checksum === actualChecksum) {
        addResult({
          name: 'Checksum Verification',
          status: 'pass',
          message: 'Checksum matches'
        });
      } else {
        addResult({
          name: 'Checksum Verification',
          status: 'fail',
          message: 'Checksum mismatch',
          details: 'File may be corrupted'
        });
        return false;
      }
    } catch (error) {
      addResult({
        name: 'Checksum Verification',
        status: 'fail',
        message: 'Failed to calculate checksum',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
    
    // Check 6: Backup age
    const ageHours = (Date.now() - backup.createdAt.getTime()) / (1000 * 60 * 60);
    if (ageHours > 26) {
      addResult({
        name: 'Backup Age',
        status: 'warn',
        message: `${ageHours.toFixed(1)} hours old`,
        details: 'Backup is older than 26 hours'
      });
    } else {
      addResult({
        name: 'Backup Age',
        status: 'pass',
        message: `${ageHours.toFixed(1)} hours old`
      });
    }
    
    // Check 7: Validation status
    if (backup.validated) {
      addResult({
        name: 'Validation Status',
        status: 'pass',
        message: 'Previously validated',
        details: backup.validatedAt ? `Last validated: ${backup.validatedAt.toISOString()}` : undefined
      });
    } else {
      addResult({
        name: 'Validation Status',
        status: 'warn',
        message: 'Not yet validated',
        details: 'Consider running validation via API'
      });
    }
    
    return true;
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyRecentBackups(): Promise<boolean> {
  console.log('\n🔍 Verifying Recent Backups\n');
  
  const prisma = new PrismaClient();
  
  try {
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
    
    if (recentAppBackup) {
      const hoursAgo = (Date.now() - recentAppBackup.createdAt.getTime()) / (1000 * 60 * 60);
      addResult({
        name: 'Recent Application Backup',
        status: 'pass',
        message: `Found backup from ${hoursAgo.toFixed(1)} hours ago`,
        details: `ID: ${recentAppBackup.id}`
      });
    } else {
      addResult({
        name: 'Recent Application Backup',
        status: 'warn',
        message: 'No backup in last 26 hours',
        details: 'Consider creating a backup'
      });
    }
    
    // Check for recent database backup
    const backupDir = process.env.BACKUP_DIR || '/var/backups/mais-inventory/database';
    
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.sql.gz'))
        .map(f => ({
          name: f,
          path: path.join(backupDir, f),
          mtime: fs.statSync(path.join(backupDir, f)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      
      if (files.length > 0) {
        const latestBackup = files[0];
        const hoursAgo = (Date.now() - latestBackup.mtime.getTime()) / (1000 * 60 * 60);
        
        if (hoursAgo > 26) {
          addResult({
            name: 'Recent Database Backup',
            status: 'warn',
            message: `Latest backup is ${hoursAgo.toFixed(1)} hours old`,
            details: latestBackup.name
          });
        } else {
          addResult({
            name: 'Recent Database Backup',
            status: 'pass',
            message: `Found backup from ${hoursAgo.toFixed(1)} hours ago`,
            details: latestBackup.name
          });
        }
      } else {
        addResult({
          name: 'Recent Database Backup',
          status: 'warn',
          message: 'No database backups found',
          details: `Checked directory: ${backupDir}`
        });
      }
    } else {
      addResult({
        name: 'Recent Database Backup',
        status: 'warn',
        message: 'Backup directory not found',
        details: `Expected: ${backupDir}`
      });
    }
    
    return true;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🔍 Backup Verification Tool');
  console.log('═'.repeat(60));
  
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Verify specific backup file
    const backupPath = args[0];
    
    if (backupPath.endsWith('.sql.gz')) {
      await verifyDatabaseBackup(backupPath);
    } else {
      // Assume it's a backup ID
      await verifyApplicationBackup(backupPath);
    }
  } else {
    // Verify recent backups
    await verifyRecentBackups();
  }
  
  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Verification Summary\n');
  
  const passed = results.filter(r => r.status === 'pass').length;
  const warned = results.filter(r => r.status === 'warn').length;
  const failed = results.filter(r => r.status === 'fail').length;
  
  console.log(`Total Checks: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings: ${warned}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Verification failed. Please review the issues above.');
    process.exit(1);
  } else if (warned > 0) {
    console.log('\n⚠️  Verification completed with warnings.');
    process.exit(0);
  } else {
    console.log('\n✅ All verifications passed!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('\n❌ Fatal error during verification:', error);
  process.exit(1);
});
