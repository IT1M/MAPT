/**
 * Performance Metrics Service
 *
 * Collects and analyzes system performance metrics including:
 * - API response times (p50, p95, p99)
 * - Error rates and types
 * - Database query performance
 * - Resource usage
 */

import { prisma } from './prisma';
import { logger } from './logger';

export interface APIMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: Date;
  userId?: string;
  error?: string;
}

export interface PerformanceStats {
  apiMetrics: {
    p50: number;
    p95: number;
    p99: number;
    avgResponseTime: number;
    totalRequests: number;
    errorRate: number;
  };
  errorMetrics: {
    total: number;
    byType: Record<string, number>;
    byEndpoint: Record<string, number>;
  };
  slowEndpoints: Array<{
    endpoint: string;
    avgDuration: number;
    count: number;
  }>;
  databaseMetrics: {
    avgQueryTime: number;
    slowQueries: number;
    connectionPoolUsage: number;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  type: 'api_slow' | 'error_rate' | 'db_size';
  threshold: number;
  enabled: boolean;
  notifyAdmins: boolean;
}

class PerformanceMetricsService {
  private metrics: APIMetric[] = [];
  private readonly MAX_METRICS = 10000; // Keep last 10k metrics in memory
  private readonly SLOW_API_THRESHOLD = 2000; // 2 seconds
  private readonly ERROR_RATE_THRESHOLD = 0.05; // 5%

  /**
   * Record an API request metric
   */
  recordAPIMetric(metric: Omit<APIMetric, 'timestamp'>): void {
    const fullMetric: APIMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log slow requests
    if (metric.duration > this.SLOW_API_THRESHOLD) {
      logger.warn('Slow API request detected', {
        endpoint: metric.endpoint,
        method: metric.method,
        duration: `${metric.duration}ms`,
        status: metric.status,
      });
    }

    // Log errors
    if (metric.status >= 400) {
      logger.error(
        'API request error',
        new Error(metric.error || 'Unknown error'),
        {
          endpoint: metric.endpoint,
          method: metric.method,
          status: metric.status,
          userId: metric.userId,
        }
      );
    }
  }

  /**
   * Get performance statistics for a time range
   */
  getPerformanceStats(minutesAgo: number = 60): PerformanceStats {
    const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000);
    const recentMetrics = this.metrics.filter((m) => m.timestamp >= cutoffTime);

    if (recentMetrics.length === 0) {
      return this.getEmptyStats();
    }

    // Calculate API metrics
    const durations = recentMetrics
      .map((m) => m.duration)
      .sort((a, b) => a - b);
    const p50Index = Math.floor(durations.length * 0.5);
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    const errorCount = recentMetrics.filter((m) => m.status >= 400).length;
    const errorRate = errorCount / recentMetrics.length;

    // Calculate error metrics by type
    const errorsByType: Record<string, number> = {};
    const errorsByEndpoint: Record<string, number> = {};

    recentMetrics
      .filter((m) => m.status >= 400)
      .forEach((m) => {
        const statusType = `${Math.floor(m.status / 100)}xx`;
        errorsByType[statusType] = (errorsByType[statusType] || 0) + 1;
        errorsByEndpoint[m.endpoint] = (errorsByEndpoint[m.endpoint] || 0) + 1;
      });

    // Calculate slow endpoints
    const endpointMetrics = new Map<string, number[]>();
    recentMetrics.forEach((m) => {
      if (!endpointMetrics.has(m.endpoint)) {
        endpointMetrics.set(m.endpoint, []);
      }
      endpointMetrics.get(m.endpoint)!.push(m.duration);
    });

    const slowEndpoints = Array.from(endpointMetrics.entries())
      .map(([endpoint, durations]) => ({
        endpoint,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        count: durations.length,
      }))
      .filter((e) => e.avgDuration > this.SLOW_API_THRESHOLD)
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    return {
      apiMetrics: {
        p50: durations[p50Index] || 0,
        p95: durations[p95Index] || 0,
        p99: durations[p99Index] || 0,
        avgResponseTime:
          durations.reduce((a, b) => a + b, 0) / durations.length,
        totalRequests: recentMetrics.length,
        errorRate,
      },
      errorMetrics: {
        total: errorCount,
        byType: errorsByType,
        byEndpoint: errorsByEndpoint,
      },
      slowEndpoints,
      databaseMetrics: {
        avgQueryTime: 0, // Placeholder - would need DB instrumentation
        slowQueries: 0,
        connectionPoolUsage: 0,
      },
    };
  }

  /**
   * Get empty stats structure
   */
  private getEmptyStats(): PerformanceStats {
    return {
      apiMetrics: {
        p50: 0,
        p95: 0,
        p99: 0,
        avgResponseTime: 0,
        totalRequests: 0,
        errorRate: 0,
      },
      errorMetrics: {
        total: 0,
        byType: {},
        byEndpoint: {},
      },
      slowEndpoints: [],
      databaseMetrics: {
        avgQueryTime: 0,
        slowQueries: 0,
        connectionPoolUsage: 0,
      },
    };
  }

  /**
   * Check alert rules and return triggered alerts
   */
  async checkAlertRules(): Promise<
    Array<{ rule: string; message: string; severity: 'warning' | 'critical' }>
  > {
    const alerts: Array<{
      rule: string;
      message: string;
      severity: 'warning' | 'critical';
    }> = [];
    const stats = this.getPerformanceStats(15); // Last 15 minutes

    // Check slow API threshold
    if (stats.apiMetrics.p95 > this.SLOW_API_THRESHOLD) {
      alerts.push({
        rule: 'slow_api',
        message: `API p95 response time is ${stats.apiMetrics.p95.toFixed(0)}ms (threshold: ${this.SLOW_API_THRESHOLD}ms)`,
        severity: stats.apiMetrics.p95 > 5000 ? 'critical' : 'warning',
      });
    }

    // Check error rate threshold
    if (stats.apiMetrics.errorRate > this.ERROR_RATE_THRESHOLD) {
      alerts.push({
        rule: 'high_error_rate',
        message: `Error rate is ${(stats.apiMetrics.errorRate * 100).toFixed(2)}% (threshold: ${this.ERROR_RATE_THRESHOLD * 100}%)`,
        severity: stats.apiMetrics.errorRate > 0.1 ? 'critical' : 'warning',
      });
    }

    // Check database size (would need actual DB query)
    try {
      const dbSize = await this.getDatabaseSize();
      const dbSizeGB = dbSize / (1024 * 1024 * 1024);
      const maxSizeGB = 10; // Example threshold

      if (dbSizeGB > maxSizeGB * 0.8) {
        alerts.push({
          rule: 'database_size',
          message: `Database size is ${dbSizeGB.toFixed(2)}GB (${((dbSizeGB / maxSizeGB) * 100).toFixed(0)}% of limit)`,
          severity: dbSizeGB > maxSizeGB * 0.9 ? 'critical' : 'warning',
        });
      }
    } catch (error) {
      logger.error('Failed to check database size', error);
    }

    return alerts;
  }

  /**
   * Get database size in bytes
   */
  private async getDatabaseSize(): Promise<number> {
    try {
      const result = await prisma.$queryRaw<Array<{ size: bigint }>>`
        SELECT pg_database_size(current_database()) as size
      `;
      return Number(result[0]?.size || 0);
    } catch (error) {
      logger.error('Failed to get database size', error);
      return 0;
    }
  }

  /**
   * Get metrics for specific endpoint
   */
  getEndpointMetrics(
    endpoint: string,
    minutesAgo: number = 60
  ): {
    avgDuration: number;
    p95: number;
    errorRate: number;
    requestCount: number;
  } {
    const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000);
    const endpointMetrics = this.metrics.filter(
      (m) => m.endpoint === endpoint && m.timestamp >= cutoffTime
    );

    if (endpointMetrics.length === 0) {
      return { avgDuration: 0, p95: 0, errorRate: 0, requestCount: 0 };
    }

    const durations = endpointMetrics
      .map((m) => m.duration)
      .sort((a, b) => a - b);
    const p95Index = Math.floor(durations.length * 0.95);
    const errorCount = endpointMetrics.filter((m) => m.status >= 400).length;

    return {
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      p95: durations[p95Index] || 0,
      errorRate: errorCount / endpointMetrics.length,
      requestCount: endpointMetrics.length,
    };
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(hoursAgo: number = 24): void {
    const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    this.metrics = this.metrics.filter((m) => m.timestamp >= cutoffTime);
    logger.info('Cleared old performance metrics', {
      cutoffTime: cutoffTime.toISOString(),
      remainingMetrics: this.metrics.length,
    });
  }

  /**
   * Get all metrics (for export/analysis)
   */
  getAllMetrics(): APIMetric[] {
    return [...this.metrics];
  }
}

// Export singleton instance
export const performanceMetricsService = new PerformanceMetricsService();
