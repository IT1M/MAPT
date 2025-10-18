/**
 * Cron Jobs Service
 * Manages scheduled tasks for automatic backups, reports, and cleanup
 */

import cron from 'node-cron';
import { BackupService } from './backup';
import { ReportService } from './report';
import { AuditService } from './audit';
import prisma from './prisma';

class CronService {
  private backupJob: cron.ScheduledTask | null = null;
  private reportJob: cron.ScheduledTask | null = null;
  private cleanupJob: cron.ScheduledTask | null = null;
  private initialized = false;

  /**
   * Initialize all cron jobs
   */
  async initialize() {
    if (this.initialized) {
      console.log('Cron service already initialized');
      return;
    }

    console.log('Initializing cron service...');

    // Initialize automatic backup job
    await this.initializeBackupJob();

    // Initialize scheduled reports job
    await this.initializeReportJob();

    // Initialize daily cleanup job
    await this.initializeCleanupJob();

    this.initialized = true;
    console.log('Cron service initialized successfully');
  }

  /**
   * Initialize automatic backup cron job
   * Runs at configured time (default 2:00 AM)
   */
  private async initializeBackupJob() {
    try {
      // Get backup configuration
      const config = await prisma.backupConfig.findFirst();

      if (!config || !config.enabled) {
        console.log('Automatic backups disabled');
        return;
      }

      // Parse schedule time (HH:mm format)
      const [hour, minute] = config.scheduleTime.split(':').map(Number);

      // Create cron expression: "minute hour * * *" (daily)
      const cronExpression = `${minute} ${hour} * * *`;

      // Schedule the job
      this.backupJob = cron.schedule(
        cronExpression,
        async () => {
          console.log(`[CRON] Starting automatic backup at ${new Date().toISOString()}`);
          await this.executeAutomaticBackup();
        },
        {
          timezone: process.env.CRON_TIMEZONE || 'Asia/Riyadh',
        }
      );

      console.log(`Automatic backup scheduled at ${config.scheduleTime} (${cronExpression})`);
    } catch (error) {
      console.error('Failed to initialize backup cron job:', error);
    }
  }

  /**
   * Initialize scheduled reports cron job
   * Checks every hour for due reports
   */
  private async initializeReportJob() {
    try {
      // Run every hour at minute 0
      const cronExpression = '0 * * * *';

      this.reportJob = cron.schedule(
        cronExpression,
        async () => {
          console.log(`[CRON] Checking for scheduled reports at ${new Date().toISOString()}`);
          await this.executeScheduledReports();
        },
        {
          timezone: process.env.CRON_TIMEZONE || 'Asia/Riyadh',
        }
      );

      console.log('Scheduled reports job initialized (runs hourly)');
    } catch (error) {
      console.error('Failed to initialize report cron job:', error);
    }
  }

  /**
   * Initialize daily cleanup cron job
   * Runs at 3:00 AM daily
   */
  private async initializeCleanupJob() {
    try {
      // Run at 3:00 AM daily
      const cronExpression = '0 3 * * *';

      this.cleanupJob = cron.schedule(
        cronExpression,
        async () => {
          console.log(`[CRON] Starting daily cleanup at ${new Date().toISOString()}`);
          await this.executeDailyCleanup();
        },
        {
          timezone: process.env.CRON_TIMEZONE || 'Asia/Riyadh',
        }
      );

      console.log('Daily cleanup job scheduled at 3:00 AM');
    } catch (error) {
      console.error('Failed to initialize cleanup cron job:', error);
    }
  }

  /**
   * Execute automatic backup
   */
  private async executeAutomaticBackup() {
    const backupService = new BackupService();
    const auditService = new AuditService();

    try {
      // Get backup configuration
      const config = await prisma.backupConfig.findFirst();

      if (!config || !config.enabled) {
        console.log('Automatic backups disabled, skipping');
        return;
      }

      // Create backup for each configured format
      for (const format of config.formats) {
        try {
          const backup = await backupService.createBackup({
            name: `automatic-backup-${new Date().toISOString().split('T')[0]}`,
            includeAuditLogs: config.includeAuditLogs,
            includeUserData: true,
            includeSettings: true,
            format,
            type: 'AUTOMATIC',
          });

          console.log(`Automatic backup created: ${backup.filename}`);

          // Log audit entry
          await auditService.logAction({
            userId: 'system',
            action: 'BACKUP',
            entityType: 'Backup',
            entityId: backup.id,
            changes: {
              type: { old: null, new: 'AUTOMATIC' },
              format: { old: null, new: format },
            },
            ipAddress: 'system',
            userAgent: 'cron-job',
          });
        } catch (error) {
          console.error(`Failed to create ${format} backup:`, error);
          await this.sendBackupFailureEmail(format, error);
        }
      }

      // Apply retention policies
      await backupService.applyRetentionPolicies();

      // Send success notification
      await this.sendBackupSuccessEmail();
    } catch (error) {
      console.error('Automatic backup failed:', error);
      await this.sendBackupFailureEmail('all', error);
    }
  }

  /**
   * Execute scheduled reports
   */
  private async executeScheduledReports() {
    const reportService = new ReportService();

    try {
      // Find all enabled schedules that are due
      const now = new Date();
      const dueSchedules = await prisma.reportSchedule.findMany({
        where: {
          enabled: true,
          nextRun: {
            lte: now,
          },
        },
        include: {
          creator: true,
        },
      });

      if (dueSchedules.length === 0) {
        console.log('No scheduled reports due');
        return;
      }

      console.log(`Found ${dueSchedules.length} scheduled reports to execute`);

      // Execute each scheduled report
      for (const schedule of dueSchedules) {
        try {
          console.log(`Executing scheduled report: ${schedule.name}`);
          const report = await reportService.executeScheduledReport(schedule.id);

          console.log(`Scheduled report generated: ${report.title}`);
        } catch (error) {
          console.error(`Failed to execute scheduled report ${schedule.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to execute scheduled reports:', error);
    }
  }

  /**
   * Execute daily cleanup
   */
  private async executeDailyCleanup() {
    try {
      console.log('Starting daily cleanup...');

      // Clean up temporary files
      await this.cleanupTempFiles();

      // Clean up old audit logs (optional, based on retention policy)
      await this.cleanupOldAuditLogs();

      // Clean up failed/incomplete backups
      await this.cleanupFailedBackups();

      // Clean up old reports (optional)
      await this.cleanupOldReports();

      console.log('Daily cleanup completed');
    } catch (error) {
      console.error('Daily cleanup failed:', error);
    }
  }

  /**
   * Clean up temporary files
   */
  private async cleanupTempFiles() {
    try {
      const fs = require('fs').promises;
      const path = require('path');

      const tempDir = path.join(process.cwd(), 'temp');

      // Check if temp directory exists
      try {
        await fs.access(tempDir);
      } catch {
        // Directory doesn't exist, nothing to clean
        return;
      }

      // Get all files in temp directory
      const files = await fs.readdir(tempDir);

      // Delete files older than 24 hours
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > oneDayMs) {
          await fs.unlink(filePath);
          console.log(`Deleted temp file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup temp files:', error);
    }
  }

  /**
   * Clean up old audit logs (optional, based on retention policy)
   */
  private async cleanupOldAuditLogs() {
    try {
      // Optional: Implement audit log retention policy
      // For now, we keep all audit logs for compliance
      console.log('Audit log cleanup skipped (retention policy: keep all)');
    } catch (error) {
      console.error('Failed to cleanup audit logs:', error);
    }
  }

  /**
   * Clean up failed/incomplete backups
   */
  private async cleanupFailedBackups() {
    try {
      // Delete backups that failed more than 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const failedBackups = await prisma.backup.findMany({
        where: {
          status: 'FAILED',
          createdAt: {
            lt: sevenDaysAgo,
          },
        },
      });

      for (const backup of failedBackups) {
        await prisma.backup.delete({
          where: { id: backup.id },
        });
        console.log(`Deleted failed backup: ${backup.filename}`);
      }

      console.log(`Cleaned up ${failedBackups.length} failed backups`);
    } catch (error) {
      console.error('Failed to cleanup failed backups:', error);
    }
  }

  /**
   * Clean up old reports (optional)
   */
  private async cleanupOldReports() {
    try {
      // Optional: Delete reports older than 90 days
      // For now, we keep all reports
      console.log('Report cleanup skipped (retention policy: keep all)');
    } catch (error) {
      console.error('Failed to cleanup reports:', error);
    }
  }

  /**
   * Send backup success email notification
   */
  private async sendBackupSuccessEmail() {
    try {
      // Get admin users
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { email: true, name: true },
      });

      if (admins.length === 0) {
        return;
      }

      // Get backup stats
      const lastBackup = await prisma.backup.findFirst({
        where: { type: 'AUTOMATIC', status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
      });

      if (!lastBackup) {
        return;
      }

      // Send email (implementation depends on email service)
      console.log('Backup success email would be sent to:', admins.map(a => a.email).join(', '));
      // TODO: Implement actual email sending using nodemailer
    } catch (error) {
      console.error('Failed to send backup success email:', error);
    }
  }

  /**
   * Send backup failure email notification
   */
  private async sendBackupFailureEmail(format: string, error: any) {
    try {
      // Get admin users
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { email: true, name: true },
      });

      if (admins.length === 0) {
        return;
      }

      // Send alert email
      console.log('Backup failure email would be sent to:', admins.map(a => a.email).join(', '));
      console.log('Error details:', error.message);
      // TODO: Implement actual email sending using nodemailer
    } catch (error) {
      console.error('Failed to send backup failure email:', error);
    }
  }

  /**
   * Reload backup job configuration
   */
  async reloadBackupJob() {
    if (this.backupJob) {
      this.backupJob.stop();
      this.backupJob = null;
    }
    await this.initializeBackupJob();
  }

  /**
   * Stop all cron jobs
   */
  stopAll() {
    if (this.backupJob) {
      this.backupJob.stop();
      console.log('Backup job stopped');
    }
    if (this.reportJob) {
      this.reportJob.stop();
      console.log('Report job stopped');
    }
    if (this.cleanupJob) {
      this.cleanupJob.stop();
      console.log('Cleanup job stopped');
    }
    this.initialized = false;
  }

  /**
   * Get status of all cron jobs
   */
  getStatus() {
    return {
      initialized: this.initialized,
      backupJob: this.backupJob ? 'running' : 'stopped',
      reportJob: this.reportJob ? 'running' : 'stopped',
      cleanupJob: this.cleanupJob ? 'running' : 'stopped',
    };
  }
}

// Export singleton instance
export const cronService = new CronService();
export default cronService;
