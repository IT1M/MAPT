import { prisma } from './prisma'
import { NotificationType, NotificationPriority } from '@prisma/client'

interface CreateNotificationOptions {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  priority?: NotificationPriority
  metadata?: any
  expiresAt?: Date
}

/**
 * Create a notification for a user
 */
export async function createNotification(options: CreateNotificationOptions) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: options.userId,
        type: options.type,
        title: options.title,
        message: options.message,
        link: options.link,
        priority: options.priority || 'NORMAL',
        metadata: options.metadata,
        expiresAt: options.expiresAt
      }
    })

    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(
  userIds: string[],
  options: Omit<CreateNotificationOptions, 'userId'>
) {
  try {
    const notifications = await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        type: options.type,
        title: options.title,
        message: options.message,
        link: options.link,
        priority: options.priority || 'NORMAL',
        metadata: options.metadata,
        expiresAt: options.expiresAt
      }))
    })

    return notifications
  } catch (error) {
    console.error('Error creating bulk notifications:', error)
    throw error
  }
}

/**
 * Notification generators for common events
 */

// System notifications
export async function notifySystemMaintenance(userIds: string[], scheduledTime: Date) {
  return createBulkNotifications(userIds, {
    type: 'SYSTEM',
    title: 'Scheduled Maintenance',
    message: `System maintenance is scheduled for ${scheduledTime.toLocaleString()}. The system will be unavailable during this time.`,
    priority: 'HIGH'
  })
}

export async function notifySystemUpdate(userIds: string[], version: string) {
  return createBulkNotifications(userIds, {
    type: 'SYSTEM',
    title: 'System Update',
    message: `The system has been updated to version ${version}. Check out the new features!`,
    link: '/help/whats-new',
    priority: 'NORMAL'
  })
}

// Activity notifications
export async function notifyItemAdded(userId: string, itemName: string, itemId: string) {
  return createNotification({
    userId,
    type: 'ACTIVITY',
    title: 'Item Added',
    message: `Successfully added "${itemName}" to inventory`,
    link: `/inventory/${itemId}`,
    priority: 'LOW'
  })
}

export async function notifyItemUpdated(userId: string, itemName: string, itemId: string) {
  return createNotification({
    userId,
    type: 'ACTIVITY',
    title: 'Item Updated',
    message: `"${itemName}" has been updated`,
    link: `/inventory/${itemId}`,
    priority: 'LOW'
  })
}

export async function notifyBulkOperationComplete(
  userId: string,
  operation: string,
  successCount: number,
  failedCount: number
) {
  return createNotification({
    userId,
    type: 'ACTIVITY',
    title: 'Bulk Operation Complete',
    message: `${operation}: ${successCount} successful, ${failedCount} failed`,
    priority: failedCount > 0 ? 'NORMAL' : 'LOW',
    metadata: { operation, successCount, failedCount }
  })
}

// Approval notifications
export async function notifyApprovalRequired(
  approverIds: string[],
  itemName: string,
  requestedBy: string
) {
  return createBulkNotifications(approverIds, {
    type: 'APPROVAL',
    title: 'Approval Required',
    message: `${requestedBy} has requested approval for "${itemName}"`,
    link: '/approvals',
    priority: 'HIGH'
  })
}

export async function notifyApprovalDecision(
  userId: string,
  itemName: string,
  approved: boolean,
  approver: string
) {
  return createNotification({
    userId,
    type: 'APPROVAL',
    title: approved ? 'Request Approved' : 'Request Rejected',
    message: `${approver} has ${approved ? 'approved' : 'rejected'} your request for "${itemName}"`,
    priority: 'NORMAL'
  })
}

// Alert notifications
export async function notifyHighRejectRate(
  supervisorIds: string[],
  rejectRate: number,
  category?: string
) {
  return createBulkNotifications(supervisorIds, {
    type: 'ALERT',
    title: 'High Reject Rate Alert',
    message: `Reject rate has reached ${rejectRate.toFixed(1)}%${category ? ` in ${category}` : ''}. Immediate attention required.`,
    link: '/analytics',
    priority: 'URGENT',
    metadata: { rejectRate, category }
  })
}

export async function notifyLowStock(managerIds: string[], itemName: string, quantity: number) {
  return createBulkNotifications(managerIds, {
    type: 'ALERT',
    title: 'Low Stock Alert',
    message: `"${itemName}" is running low (${quantity} units remaining)`,
    link: '/inventory',
    priority: 'HIGH',
    metadata: { itemName, quantity }
  })
}

export async function notifyBackupFailed(adminIds: string[], error: string) {
  return createBulkNotifications(adminIds, {
    type: 'ALERT',
    title: 'Backup Failed',
    message: `Scheduled backup failed: ${error}`,
    link: '/backup',
    priority: 'URGENT',
    metadata: { error }
  })
}

export async function notifyBackupComplete(adminIds: string[], filename: string, size: number) {
  return createBulkNotifications(adminIds, {
    type: 'SYSTEM',
    title: 'Backup Complete',
    message: `Database backup completed successfully (${(size / 1024 / 1024).toFixed(2)} MB)`,
    link: '/backup',
    priority: 'LOW',
    metadata: { filename, size }
  })
}

// Report notifications
export async function notifyReportReady(userId: string, reportTitle: string, reportId: string) {
  return createNotification({
    userId,
    type: 'ACTIVITY',
    title: 'Report Ready',
    message: `Your report "${reportTitle}" is ready for download`,
    link: `/reports/${reportId}`,
    priority: 'NORMAL'
  })
}

// Security notifications
export async function notifyNewDeviceLogin(
  userId: string,
  deviceInfo: { deviceType: string; browser: string; location: string }
) {
  return createNotification({
    userId,
    type: 'ALERT',
    title: 'New Device Login',
    message: `Login detected from ${deviceInfo.deviceType} (${deviceInfo.browser}) in ${deviceInfo.location}`,
    link: '/settings/security',
    priority: 'HIGH',
    metadata: deviceInfo
  })
}

export async function notifyPasswordChanged(userId: string) {
  return createNotification({
    userId,
    type: 'ALERT',
    title: 'Password Changed',
    message: 'Your password has been changed successfully. If this wasn\'t you, please contact support immediately.',
    link: '/settings/security',
    priority: 'HIGH'
  })
}

export async function notifyAccountLocked(userId: string, unlockTime: Date) {
  return createNotification({
    userId,
    type: 'ALERT',
    title: 'Account Locked',
    message: `Your account has been locked due to multiple failed login attempts. It will be unlocked at ${unlockTime.toLocaleString()}.`,
    priority: 'URGENT'
  })
}

/**
 * Clean up expired notifications
 */
export async function cleanupExpiredNotifications() {
  try {
    const result = await prisma.notification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })

    console.log(`Cleaned up ${result.count} expired notifications`)
    return result.count
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error)
    throw error
  }
}

/**
 * Delete old read notifications (older than 30 days)
 */
export async function cleanupOldNotifications() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const result = await prisma.notification.deleteMany({
      where: {
        read: true,
        readAt: {
          lt: thirtyDaysAgo
        }
      }
    })

    console.log(`Cleaned up ${result.count} old notifications`)
    return result.count
  } catch (error) {
    console.error('Error cleaning up old notifications:', error)
    throw error
  }
}
