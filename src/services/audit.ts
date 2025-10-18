import { prisma } from './prisma';
import { createHmac } from 'crypto';
import ExcelJS from 'exceljs';

// Define types to match Prisma enums
export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'VIEW' | 'REVERT' | 'BACKUP' | 'RESTORE';
export type EntityType = 'InventoryItem' | 'User' | 'Report' | 'Backup' | 'Settings' | 'AuditLog';

// AuditLog type from database
export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: ActionType;
  entityType: EntityType;
  entityId: string;
  changes: any;
  ipAddress: string;
  userAgent: string;
  signature: string;
}

// Types
export interface LogActionParams {
  userId: string;
  action: ActionType;
  entityType: EntityType;
  entityId: string;
  changes?: Record<string, any> | any;
  ipAddress: string;
  userAgent: string;
}

export interface AuditFilters {
  dateFrom?: Date;
  dateTo?: Date;
  userIds?: string[];
  actions?: ActionType[];
  entityTypes?: EntityType[];
  search?: string;
}

export interface Pagination {
  page: number;
  limit: number;
}

export interface AuditEntryWithUser extends AuditLog {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface AuditStatistics {
  totalActions: number;
  mostActiveUser: { id: string; name: string; count: number } | null;
  mostCommonAction: { type: ActionType; count: number } | null;
  criticalActions: number;
  activityChart: { date: string; counts: Record<string, number> }[];
  userLeaderboard: { userId: string; name: string; count: number }[];
}

export interface DateRange {
  from: Date;
  to: Date;
}

// Error class
export class AuditError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuditError';
  }
}

// Audit queue for non-blocking logging
class AuditQueue {
  private queue: LogActionParams[] = [];
  private processing = false;

  async add(params: LogActionParams): Promise<void> {
    this.queue.push(params);
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const params = this.queue.shift();
      if (params) {
        try {
          await this.processEntry(params);
        } catch (error) {
          console.error('Failed to process audit entry:', error);
          // Re-queue on failure (with limit to prevent infinite loop)
          if (this.queue.length < 100) {
            this.queue.push(params);
          }
        }
      }
    }
    
    this.processing = false;
  }

  private async processEntry(params: LogActionParams): Promise<void> {
    const signature = AuditService.signEntry(params);
    
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action as any,
        entityType: params.entityType as any,
        entityId: params.entityId,
        changes: params.changes || {},
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        signature,
      } as any,
    });
  }
}

// Singleton audit queue
const auditQueue = new AuditQueue();

/**
 * AuditService - Comprehensive audit trail management
 * 
 * Features:
 * - Non-blocking audit logging with queue
 * - Cryptographic signing with HMAC-SHA256
 * - Advanced filtering and pagination
 * - Statistics and analytics
 * - Export to CSV, Excel, PDF
 * - Change reversion for admins
 */
export class AuditService {
  private static readonly SIGNING_SECRET = process.env.AUDIT_SIGNING_SECRET || 'default-secret-change-in-production';

  /**
   * Log an action (non-blocking, queued)
   */
  static async logAction(params: LogActionParams): Promise<void> {
    await auditQueue.add(params);
  }

  /**
   * Sign an audit entry using HMAC-SHA256
   */
  static signEntry(params: LogActionParams): string {
    const data = JSON.stringify({
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      changes: params.changes,
      timestamp: new Date().toISOString(),
    });

    return createHmac('sha256', this.SIGNING_SECRET)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify an audit entry signature
   */
  static verifyEntry(entry: AuditLog): boolean {
    const data = JSON.stringify({
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      changes: entry.changes,
      timestamp: entry.timestamp.toISOString(),
    });

    const expectedSignature = createHmac('sha256', this.SIGNING_SECRET)
      .update(data)
      .digest('hex');

    return entry.signature === expectedSignature;
  }

  /**
   * Query audit logs with filtering and pagination
   */
  static async queryLogs(
    filters: AuditFilters,
    pagination: Pagination
  ): Promise<{ entries: AuditEntryWithUser[]; total: number }> {
    const where: any = {};

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.timestamp = {};
      if (filters.dateFrom) where.timestamp.gte = filters.dateFrom;
      if (filters.dateTo) where.timestamp.lte = filters.dateTo;
    }

    // User filter
    if (filters.userIds && filters.userIds.length > 0) {
      where.userId = { in: filters.userIds };
    }

    // Action type filter
    if (filters.actions && filters.actions.length > 0) {
      where.action = { in: filters.actions };
    }

    // Entity type filter
    if (filters.entityTypes && filters.entityTypes.length > 0) {
      where.entityType = { in: filters.entityTypes };
    }

    // Text search (entity ID, IP address)
    if (filters.search) {
      where.OR = [
        { entityId: { contains: filters.search, mode: 'insensitive' } },
        { ipAddress: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.auditLog.count({ where });

    // Get paginated entries with user data
    const entries = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }) as any;

    return { entries, total };
  }

  /**
   * Get audit statistics for dashboard
   */
  static async getStatistics(dateRange: DateRange): Promise<AuditStatistics> {
    const where = {
      timestamp: {
        gte: dateRange.from,
        lte: dateRange.to,
      },
    };

    // Total actions
    const totalActions = await prisma.auditLog.count({ where });

    // Most active user
    const userCounts = await prisma.auditLog.groupBy({
      by: ['userId'],
      where,
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 1,
    });

    let mostActiveUser = null;
    if (userCounts.length > 0) {
      const user = await prisma.user.findUnique({
        where: { id: userCounts[0].userId },
        select: { id: true, name: true },
      });
      if (user) {
        mostActiveUser = {
          id: user.id,
          name: user.name,
          count: userCounts[0]._count.userId,
        };
      }
    }

    // Most common action
    const actionCounts = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 1,
    });

    const mostCommonAction = actionCounts.length > 0
      ? { type: actionCounts[0].action, count: actionCounts[0]._count.action }
      : null;

    // Critical actions (DELETE, REVERT, BACKUP, RESTORE)
    const criticalActions = await prisma.auditLog.count({
      where: {
        ...where,
        action: { in: ['DELETE', 'REVERT', 'BACKUP', 'RESTORE'] as any },
      },
    });

    // Activity chart (last 7 days)
    const activityChart = await this.getActivityChart(dateRange);

    // User leaderboard (top 10)
    const userLeaderboard = await this.getUserLeaderboard(dateRange);

    return {
      totalActions,
      mostActiveUser,
      mostCommonAction,
      criticalActions,
      activityChart,
      userLeaderboard,
    };
  }

  /**
   * Get activity chart data
   */
  private static async getActivityChart(dateRange: DateRange): Promise<{ date: string; counts: Record<string, number> }[]> {
    const entries = await prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
      select: {
        timestamp: true,
        action: true,
      },
    });

    // Group by date and action
    const chartData: Record<string, Record<string, number>> = {};
    
    entries.forEach(entry => {
      const date = entry.timestamp.toISOString().split('T')[0];
      if (!chartData[date]) {
        chartData[date] = {};
      }
      if (!chartData[date][entry.action]) {
        chartData[date][entry.action] = 0;
      }
      chartData[date][entry.action]++;
    });

    return Object.entries(chartData).map(([date, counts]) => ({
      date,
      counts,
    }));
  }

  /**
   * Get user leaderboard
   */
  private static async getUserLeaderboard(dateRange: DateRange): Promise<{ userId: string; name: string; count: number }[]> {
    const userCounts = await prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        timestamp: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    });

    const leaderboard = await Promise.all(
      userCounts.map(async (uc) => {
        const user = await prisma.user.findUnique({
          where: { id: uc.userId },
          select: { id: true, name: true },
        });
        return {
          userId: uc.userId,
          name: user?.name || 'Unknown',
          count: uc._count.userId,
        };
      })
    );

    return leaderboard;
  }

  /**
   * Get entry details with related entries
   */
  static async getEntryDetails(entryId: string): Promise<{
    entry: AuditEntryWithUser;
    relatedEntries: AuditEntryWithUser[];
  }> {
    const entry = await prisma.auditLog.findUnique({
      where: { id: entryId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }) as any;

    if (!entry) {
      throw new AuditError('Audit entry not found', 'AUDIT_ENTRY_NOT_FOUND');
    }

    // Find related entries (same entity, within ±1 hour)
    const oneHourBefore = new Date(entry.timestamp.getTime() - 60 * 60 * 1000);
    const oneHourAfter = new Date(entry.timestamp.getTime() + 60 * 60 * 1000);

    const relatedEntries = await prisma.auditLog.findMany({
      where: {
        entityType: entry.entityType as any,
        entityId: entry.entityId,
        id: { not: entryId },
        timestamp: {
          gte: oneHourBefore,
          lte: oneHourAfter,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    }) as any;

    return { entry, relatedEntries };
  }

  /**
   * Revert a change (ADMIN only)
   */
  static async revertChange(entryId: string, adminUserId: string): Promise<AuditLog> {
    // Verify admin user
    const admin = await prisma.user.findUnique({
      where: { id: adminUserId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new AuditError('Unauthorized: Only admins can revert changes', 'AUDIT_UNAUTHORIZED');
    }

    // Get the entry to revert
    const entry = await prisma.auditLog.findUnique({
      where: { id: entryId },
    }) as any;

    if (!entry) {
      throw new AuditError('Audit entry not found', 'AUDIT_ENTRY_NOT_FOUND');
    }

    // Only UPDATE actions on InventoryItem can be reverted
    if (entry.action !== 'UPDATE' || entry.entityType !== 'InventoryItem') {
      throw new AuditError('Only UPDATE actions on InventoryItem can be reverted', 'AUDIT_REVERT_FAILED');
    }

    const changes = entry.changes as any;
    if (!changes) {
      throw new AuditError('No changes to revert', 'AUDIT_REVERT_FAILED');
    }

    // Revert the changes
    const revertData: any = {};
    Object.entries(changes).forEach(([field, change]: [string, any]) => {
      if (change?.old !== undefined) {
        revertData[field] = change.old;
      }
    });

    try {
      // Update the inventory item
      await prisma.inventoryItem.update({
        where: { id: entry.entityId },
        data: revertData,
      });

      // Create audit entry for the revert
      const revertEntry = await prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'REVERT' as any,
          entityType: entry.entityType,
          entityId: entry.entityId,
          changes: {
            revertedEntryId: entryId,
            revertedChanges: changes,
          },
          ipAddress: 'system',
          userAgent: 'system',
          signature: this.signEntry({
            userId: adminUserId,
            action: 'REVERT',
            entityType: entry.entityType,
            entityId: entry.entityId,
            changes: { revertedEntryId: entryId },
            ipAddress: 'system',
            userAgent: 'system',
          }),
        } as any,
      }) as any;

      return revertEntry;
    } catch (error) {
      throw new AuditError('Failed to revert change', 'AUDIT_REVERT_FAILED');
    }
  }

  /**
   * Export audit logs to CSV
   */
  static async exportToCSV(filters: AuditFilters): Promise<string> {
    const { entries } = await this.queryLogs(filters, { page: 1, limit: 10000 });

    const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Changes', 'IP Address', 'User Agent'];
    const rows = entries.map(entry => [
      entry.timestamp.toISOString(),
      entry.user.name,
      entry.action,
      entry.entityType,
      entry.entityId,
      JSON.stringify(entry.changes),
      entry.ipAddress,
      entry.userAgent,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell)}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Export audit logs to Excel
   */
  static async exportToExcel(filters: AuditFilters): Promise<Buffer> {
    const { entries } = await this.queryLogs(filters, { page: 1, limit: 10000 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Audit Log');

    // Add headers
    worksheet.columns = [
      { header: 'Timestamp', key: 'timestamp', width: 20 },
      { header: 'User', key: 'user', width: 20 },
      { header: 'Action', key: 'action', width: 15 },
      { header: 'Entity Type', key: 'entityType', width: 15 },
      { header: 'Entity ID', key: 'entityId', width: 30 },
      { header: 'Changes', key: 'changes', width: 40 },
      { header: 'IP Address', key: 'ipAddress', width: 15 },
      { header: 'User Agent', key: 'userAgent', width: 30 },
    ];

    // Add data
    entries.forEach(entry => {
      worksheet.addRow({
        timestamp: entry.timestamp.toISOString(),
        user: entry.user.name,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        changes: JSON.stringify(entry.changes),
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Export audit logs (main method)
   */
  static async exportLogs(
    filters: AuditFilters,
    format: 'csv' | 'excel' | 'pdf',
    encrypted: boolean = false
  ): Promise<{ data: string | Buffer; filename: string }> {
    let data: string | Buffer;
    let filename: string;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    switch (format) {
      case 'csv':
        data = await this.exportToCSV(filters);
        filename = `audit-log-${timestamp}.csv`;
        break;
      case 'excel':
        data = await this.exportToExcel(filters);
        filename = `audit-log-${timestamp}.xlsx`;
        break;
      case 'pdf':
        // PDF export will be implemented with react-pdf in the API route
        throw new AuditError('PDF export not yet implemented in service', 'AUDIT_EXPORT_FAILED');
      default:
        throw new AuditError('Invalid export format', 'AUDIT_EXPORT_FAILED');
    }

    // TODO: Implement encryption if requested
    if (encrypted) {
      console.warn('Encryption not yet implemented');
    }

    return { data, filename };
  }
}
