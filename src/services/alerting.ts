/**
 * Alerting and Notification Service
 * 
 * Provides alerting capabilities for monitoring critical system events
 */

import { logger } from './logger';

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum AlertType {
  ERROR_RATE = 'error_rate',
  RESPONSE_TIME = 'response_time',
  DATABASE_CONNECTION = 'database_connection',
  DEPLOYMENT = 'deployment',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  resolved?: boolean;
  resolvedAt?: Date;
}

export interface AlertThreshold {
  type: AlertType;
  threshold: number;
  window: number; // Time window in milliseconds
  enabled: boolean;
}

class AlertingService {
  private alerts: Alert[] = [];
  private thresholds: Map<AlertType, AlertThreshold> = new Map();
  private metrics: Map<string, number[]> = new Map();

  constructor() {
    this.initializeThresholds();
  }

  /**
   * Initialize default alert thresholds
   */
  private initializeThresholds(): void {
    // Error rate threshold: > 1% in 5 minutes
    this.thresholds.set(AlertType.ERROR_RATE, {
      type: AlertType.ERROR_RATE,
      threshold: 1, // 1%
      window: 5 * 60 * 1000, // 5 minutes
      enabled: true,
    });

    // Response time threshold: > 3s average in 5 minutes
    this.thresholds.set(AlertType.RESPONSE_TIME, {
      type: AlertType.RESPONSE_TIME,
      threshold: 3000, // 3 seconds
      window: 5 * 60 * 1000, // 5 minutes
      enabled: true,
    });

    // Database connection threshold: > 3 failures in 1 minute
    this.thresholds.set(AlertType.DATABASE_CONNECTION, {
      type: AlertType.DATABASE_CONNECTION,
      threshold: 3,
      window: 1 * 60 * 1000, // 1 minute
      enabled: true,
    });

    // Performance threshold: Core Web Vitals in "poor" range
    this.thresholds.set(AlertType.PERFORMANCE, {
      type: AlertType.PERFORMANCE,
      threshold: 0, // Any poor metric
      window: 10 * 60 * 1000, // 10 minutes
      enabled: true,
    });
  }

  /**
   * Create an alert
   */
  createAlert(
    type: AlertType,
    severity: AlertSeverity,
    message: string,
    metadata?: Record<string, any>
  ): Alert {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      timestamp: new Date(),
      metadata,
      resolved: false,
    };

    this.alerts.push(alert);

    // Log alert
    logger.error(`ALERT [${severity.toUpperCase()}]: ${message}`, new Error(message), {
      alertId: alert.id,
      type,
      metadata,
    });

    // Send notifications
    this.sendNotifications(alert);

    return alert;
  }

  /**
   * Track metric for threshold monitoring
   */
  trackMetric(type: AlertType, value: number): void {
    const key = type.toString();
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metrics = this.metrics.get(key)!;
    metrics.push(value);

    // Keep only recent metrics within the window
    const threshold = this.thresholds.get(type);
    if (threshold) {
      const cutoff = Date.now() - threshold.window;
      const filtered = metrics.filter((_, index) => {
        const timestamp = Date.now() - (metrics.length - index - 1) * 1000;
        return timestamp > cutoff;
      });
      this.metrics.set(key, filtered);

      // Check if threshold is exceeded
      this.checkThreshold(type, filtered);
    }
  }

  /**
   * Check if threshold is exceeded
   */
  private checkThreshold(type: AlertType, metrics: number[]): void {
    const threshold = this.thresholds.get(type);
    if (!threshold || !threshold.enabled || metrics.length === 0) {
      return;
    }

    let shouldAlert = false;
    let message = '';
    let severity = AlertSeverity.WARNING;

    switch (type) {
      case AlertType.ERROR_RATE: {
        const errorRate = (metrics.reduce((a, b) => a + b, 0) / metrics.length) * 100;
        if (errorRate > threshold.threshold) {
          shouldAlert = true;
          message = `Error rate (${errorRate.toFixed(2)}%) exceeds threshold (${threshold.threshold}%)`;
          severity = errorRate > threshold.threshold * 2 ? AlertSeverity.CRITICAL : AlertSeverity.ERROR;
        }
        break;
      }

      case AlertType.RESPONSE_TIME: {
        const avgResponseTime = metrics.reduce((a, b) => a + b, 0) / metrics.length;
        if (avgResponseTime > threshold.threshold) {
          shouldAlert = true;
          message = `Average response time (${avgResponseTime.toFixed(0)}ms) exceeds threshold (${threshold.threshold}ms)`;
          severity = avgResponseTime > threshold.threshold * 2 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING;
        }
        break;
      }

      case AlertType.DATABASE_CONNECTION: {
        const failures = metrics.reduce((a, b) => a + b, 0);
        if (failures >= threshold.threshold) {
          shouldAlert = true;
          message = `Database connection failures (${failures}) exceed threshold (${threshold.threshold})`;
          severity = AlertSeverity.CRITICAL;
        }
        break;
      }

      case AlertType.PERFORMANCE: {
        const poorMetrics = metrics.filter(m => m > 0).length;
        if (poorMetrics > 0) {
          shouldAlert = true;
          message = `${poorMetrics} Core Web Vitals metrics in poor range`;
          severity = AlertSeverity.WARNING;
        }
        break;
      }
    }

    if (shouldAlert) {
      // Check if similar alert already exists and is not resolved
      const existingAlert = this.alerts.find(
        a => a.type === type && !a.resolved && 
        Date.now() - a.timestamp.getTime() < threshold.window
      );

      if (!existingAlert) {
        this.createAlert(type, severity, message, {
          metrics: metrics.slice(-10), // Last 10 metrics
          threshold: threshold.threshold,
          window: threshold.window,
        });
      }
    }
  }

  /**
   * Send notifications for alert
   */
  private async sendNotifications(alert: Alert): Promise<void> {
    // Send to different channels based on severity
    if (alert.severity === AlertSeverity.CRITICAL || alert.severity === AlertSeverity.ERROR) {
      await this.sendEmailNotification(alert);
      await this.sendSlackNotification(alert);
    } else if (alert.severity === AlertSeverity.WARNING) {
      await this.sendSlackNotification(alert);
    }

    // Log notification
    logger.info('Alert notification sent', {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
    });
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Alert): Promise<void> {
    // This is a placeholder for email integration
    // In production, integrate with services like:
    // - SendGrid
    // - AWS SES
    // - Postmark
    // - Resend

    if (!process.env.EMAIL_SERVER || !process.env.EMAIL_FROM) {
      logger.warn('Email notifications not configured');
      return;
    }

    try {
      // Example email sending logic
      logger.info('Sending email notification', {
        alertId: alert.id,
        to: process.env.ALERT_EMAIL_TO || 'admin@example.com',
        subject: `[${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`,
      });

      // TODO: Implement actual email sending
      // await sendEmail({
      //   to: process.env.ALERT_EMAIL_TO,
      //   subject: `[${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`,
      //   body: this.formatAlertEmail(alert),
      // });
    } catch (error) {
      logger.error('Failed to send email notification', error);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alert: Alert): Promise<void> {
    // This is a placeholder for Slack integration
    // In production, use Slack Webhook or Slack API

    if (!process.env.SLACK_WEBHOOK_URL) {
      logger.warn('Slack notifications not configured');
      return;
    }

    try {
      const color = this.getSlackColor(alert.severity);
      const payload = {
        text: `🚨 Alert: ${alert.message}`,
        attachments: [
          {
            color,
            fields: [
              {
                title: 'Type',
                value: alert.type,
                short: true,
              },
              {
                title: 'Severity',
                value: alert.severity.toUpperCase(),
                short: true,
              },
              {
                title: 'Time',
                value: alert.timestamp.toISOString(),
                short: true,
              },
              {
                title: 'Alert ID',
                value: alert.id,
                short: true,
              },
            ],
          },
        ],
      };

      logger.info('Sending Slack notification', {
        alertId: alert.id,
        webhook: process.env.SLACK_WEBHOOK_URL.substring(0, 30) + '...',
      });

      // TODO: Implement actual Slack webhook call
      // await fetch(process.env.SLACK_WEBHOOK_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      // });
    } catch (error) {
      logger.error('Failed to send Slack notification', error);
    }
  }

  /**
   * Get Slack color for severity
   */
  private getSlackColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return '#FF0000'; // Red
      case AlertSeverity.ERROR:
        return '#FF6B6B'; // Light red
      case AlertSeverity.WARNING:
        return '#FFA500'; // Orange
      case AlertSeverity.INFO:
        return '#36A64F'; // Green
      default:
        return '#808080'; // Gray
    }
  }

  /**
   * Format alert for email
   */
  private formatAlertEmail(alert: Alert): string {
    return `
Alert Details:
--------------
Type: ${alert.type}
Severity: ${alert.severity.toUpperCase()}
Message: ${alert.message}
Time: ${alert.timestamp.toISOString()}
Alert ID: ${alert.id}

${alert.metadata ? `
Metadata:
${JSON.stringify(alert.metadata, null, 2)}
` : ''}

---
This is an automated alert from the Saudi Mais Inventory Management System.
    `.trim();
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();

      logger.info('Alert resolved', {
        alertId,
        type: alert.type,
        duration: alert.resolvedAt.getTime() - alert.timestamp.getTime(),
      });
    }
  }

  /**
   * Get all alerts
   */
  getAlerts(options?: {
    type?: AlertType;
    severity?: AlertSeverity;
    resolved?: boolean;
    limit?: number;
  }): Alert[] {
    let filtered = [...this.alerts];

    if (options?.type) {
      filtered = filtered.filter(a => a.type === options.type);
    }

    if (options?.severity) {
      filtered = filtered.filter(a => a.severity === options.severity);
    }

    if (options?.resolved !== undefined) {
      filtered = filtered.filter(a => a.resolved === options.resolved);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * Update alert threshold
   */
  updateThreshold(type: AlertType, threshold: Partial<AlertThreshold>): void {
    const existing = this.thresholds.get(type);
    if (existing) {
      this.thresholds.set(type, { ...existing, ...threshold });
      logger.info('Alert threshold updated', { type, threshold });
    }
  }

  /**
   * Get alert statistics
   */
  getStatistics(): {
    total: number;
    byType: Record<AlertType, number>;
    bySeverity: Record<AlertSeverity, number>;
    resolved: number;
    unresolved: number;
  } {
    const byType = {} as Record<AlertType, number>;
    const bySeverity = {} as Record<AlertSeverity, number>;

    this.alerts.forEach(alert => {
      byType[alert.type] = (byType[alert.type] || 0) + 1;
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
    });

    return {
      total: this.alerts.length,
      byType,
      bySeverity,
      resolved: this.alerts.filter(a => a.resolved).length,
      unresolved: this.alerts.filter(a => !a.resolved).length,
    };
  }
}

// Export singleton instance
export const alertingService = new AlertingService();
