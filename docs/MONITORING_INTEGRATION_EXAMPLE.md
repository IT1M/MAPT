# Monitoring Integration Example

This document provides practical examples of integrating the monitoring system into your application.

## Complete Integration Example

### 1. Root Layout Setup

**File**: `src/app/layout.tsx`

```typescript
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { WebVitalsTracker } from '@/components/shared/WebVitalsTracker';
import { VercelAnalytics } from '@/components/shared/VercelAnalytics';
import { setupGlobalErrorHandlers } from '@/utils/error-reporting';
import { useEffect } from 'react';

// Initialize global error handlers
if (typeof window !== 'undefined') {
  setupGlobalErrorHandlers();
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        
        {/* Performance and Analytics Tracking */}
        <WebVitalsTracker />
        <VercelAnalytics />
      </body>
    </html>
  );
}
```

### 2. API Route with Full Monitoring

**File**: `src/app/api/users/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withErrorLogging } from '@/middleware/error-logging';
import { logger } from '@/services/logger';
import { performanceMonitor } from '@/utils/performance-monitor';
import { alertingService, AlertType } from '@/services/alerting';
import { prisma } from '@/services/prisma';

export const GET = withErrorLogging(async (req: NextRequest) => {
  const startTime = Date.now();
  
  // Log incoming request
  logger.info('Fetching users', {
    method: 'GET',
    url: req.url,
  });

  try {
    // Track database query performance
    const dbStartTime = Date.now();
    const users = await prisma.user.findMany();
    const dbDuration = Date.now() - dbStartTime;
    
    performanceMonitor.trackDatabaseQuery('SELECT * FROM users', dbDuration);
    
    // Calculate total duration
    const duration = Date.now() - startTime;
    
    // Track API performance
    performanceMonitor.trackAPIRequest('/api/users', 'GET', duration, 200);
    
    // Track metrics for alerting
    alertingService.trackMetric(AlertType.RESPONSE_TIME, duration);
    alertingService.trackMetric(AlertType.ERROR_RATE, 0); // Success
    
    // Log success
    logger.info('Users fetched successfully', {
      count: users.length,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      users,
      meta: {
        count: users.length,
        duration,
      },
    });
  } catch (error) {
    // Track error metrics
    alertingService.trackMetric(AlertType.ERROR_RATE, 1);
    
    // Log error with context
    logger.error('Failed to fetch users', error, {
      method: 'GET',
      url: req.url,
      duration: `${Date.now() - startTime}ms`,
    });

    // Re-throw to let error logging middleware handle response
    throw error;
  }
});
```

### 3. Component with Error Boundary

**File**: `src/components/UserList.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary';
import { logger } from '@/services/logger';
import { reportError } from '@/utils/error-reporting';
import { trackEvent } from '@/components/shared/VercelAnalytics';

function UserListContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        logger.debug('Fetching users from API');
        
        const response = await fetch('/api/users');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setUsers(data.users);
        
        // Track successful load
        trackEvent('users_loaded', {
          count: data.users.length,
          duration: data.meta.duration,
        });
        
        logger.info('Users loaded successfully', {
          count: data.users.length,
        });
      } catch (error) {
        // Report error
        reportError('Failed to load users', error, {
          component: 'UserList',
        });
        
        // Track error event
        trackEvent('users_load_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div>
      <h2>Users ({users.length})</h2>
      <ul>
        {users.map((user: any) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}

// Export with error boundary
export function UserList() {
  return (
    <ComponentErrorBoundary componentName="UserList">
      <UserListContent />
    </ComponentErrorBoundary>
  );
}
```

### 4. Database Service with Monitoring

**File**: `src/services/user-service.ts`

```typescript
import { prisma } from './prisma';
import { logger } from './logger';
import { performanceMonitor } from '@/utils/performance-monitor';
import { alertingService, AlertType } from './alerting';

export class UserService {
  private dbLogger = logger.child({ service: 'UserService' });

  async findAll() {
    const startTime = Date.now();
    
    try {
      this.dbLogger.debug('Fetching all users');
      
      const users = await prisma.user.findMany();
      
      const duration = Date.now() - startTime;
      performanceMonitor.trackDatabaseQuery('User.findAll', duration);
      
      this.dbLogger.info('Users fetched', {
        count: users.length,
        duration: `${duration}ms`,
      });
      
      return users;
    } catch (error) {
      // Track database connection failure
      alertingService.trackMetric(AlertType.DATABASE_CONNECTION, 1);
      
      this.dbLogger.error('Failed to fetch users', error);
      throw error;
    }
  }

  async findById(id: string) {
    const startTime = Date.now();
    
    try {
      this.dbLogger.debug('Fetching user by ID', { userId: id });
      
      const user = await prisma.user.findUnique({
        where: { id },
      });
      
      const duration = Date.now() - startTime;
      performanceMonitor.trackDatabaseQuery('User.findById', duration);
      
      if (!user) {
        this.dbLogger.warn('User not found', { userId: id });
        return null;
      }
      
      this.dbLogger.info('User fetched', {
        userId: id,
        duration: `${duration}ms`,
      });
      
      return user;
    } catch (error) {
      alertingService.trackMetric(AlertType.DATABASE_CONNECTION, 1);
      this.dbLogger.error('Failed to fetch user', error, { userId: id });
      throw error;
    }
  }

  async create(data: any) {
    const startTime = Date.now();
    
    try {
      this.dbLogger.info('Creating user', { email: data.email });
      
      const user = await prisma.user.create({
        data,
      });
      
      const duration = Date.now() - startTime;
      performanceMonitor.trackDatabaseQuery('User.create', duration);
      
      this.dbLogger.info('User created', {
        userId: user.id,
        duration: `${duration}ms`,
      });
      
      return user;
    } catch (error) {
      alertingService.trackMetric(AlertType.DATABASE_CONNECTION, 1);
      this.dbLogger.error('Failed to create user', error, { email: data.email });
      throw error;
    }
  }
}

export const userService = new UserService();
```

### 5. Custom Hook with Error Handling

**File**: `src/hooks/useUsers.ts`

```typescript
import { useState, useEffect } from 'react';
import { logger } from '@/services/logger';
import { reportError } from '@/utils/error-reporting';
import { trackEvent } from '@/components/shared/VercelAnalytics';

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const hookLogger = logger.child({ hook: 'useUsers' });
    
    async function fetchUsers() {
      try {
        hookLogger.debug('Fetching users');
        
        const response = await fetch('/api/users');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        setUsers(data.users);
        
        trackEvent('users_loaded', { count: data.users.length });
        hookLogger.info('Users loaded', { count: data.users.length });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        
        reportError('Failed to load users in hook', error, {
          hook: 'useUsers',
        });
        
        trackEvent('users_load_error', {
          error: error.message,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  return { users, loading, error };
}
```

### 6. Monitoring Dashboard Component

**File**: `src/components/admin/MonitoringDashboard.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { performanceMonitor } from '@/utils/performance-monitor';
import { alertingService } from '@/services/alerting';

export function MonitoringDashboard() {
  const [report, setReport] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Get performance report
    const perfReport = performanceMonitor.getPerformanceReport();
    setReport(perfReport);

    // Get recent alerts
    const recentAlerts = alertingService.getAlerts({
      resolved: false,
      limit: 10,
    });
    setAlerts(recentAlerts);

    // Get alert statistics
    const alertStats = alertingService.getStatistics();
    setStats(alertStats);
  }, []);

  if (!report || !stats) {
    return <div>Loading monitoring data...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">System Monitoring</h1>

      {/* Web Vitals */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Core Web Vitals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {report.webVitals.map((vital: any) => (
            <div
              key={vital.id}
              className={`p-4 rounded-lg ${
                vital.rating === 'good'
                  ? 'bg-green-100'
                  : vital.rating === 'needs-improvement'
                  ? 'bg-yellow-100'
                  : 'bg-red-100'
              }`}
            >
              <div className="font-semibold">{vital.name}</div>
              <div className="text-2xl">
                {vital.value.toFixed(2)}
                {vital.name === 'CLS' ? '' : 'ms'}
              </div>
              <div className="text-sm capitalize">{vital.rating}</div>
            </div>
          ))}
        </div>
      </section>

      {/* API Metrics */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">API Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-100 rounded-lg">
            <div className="text-sm text-gray-600">Total Requests</div>
            <div className="text-2xl font-bold">{report.apiMetrics.total}</div>
          </div>
          <div className="p-4 bg-green-100 rounded-lg">
            <div className="text-sm text-gray-600">Avg Response Time</div>
            <div className="text-2xl font-bold">
              {report.apiMetrics.averageResponseTime.toFixed(0)}ms
            </div>
          </div>
          <div className="p-4 bg-purple-100 rounded-lg">
            <div className="text-sm text-gray-600">Success Rate</div>
            <div className="text-2xl font-bold">
              {report.apiMetrics.successRate.toFixed(1)}%
            </div>
          </div>
          <div className="p-4 bg-red-100 rounded-lg">
            <div className="text-sm text-gray-600">Slow Requests</div>
            <div className="text-2xl font-bold">
              {report.apiMetrics.slowRequests}
            </div>
          </div>
        </div>
      </section>

      {/* Active Alerts */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Active Alerts ({alerts.length})
        </h2>
        {alerts.length === 0 ? (
          <div className="p-4 bg-green-50 rounded-lg text-green-800">
            No active alerts - system is healthy
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg ${
                  alert.severity === 'critical'
                    ? 'bg-red-100 border-red-300'
                    : alert.severity === 'error'
                    ? 'bg-orange-100 border-orange-300'
                    : 'bg-yellow-100 border-yellow-300'
                } border`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{alert.message}</div>
                    <div className="text-sm text-gray-600">
                      {alert.type} - {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded uppercase">
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Alert Statistics */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Alert Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-100 rounded-lg">
            <div className="text-sm text-gray-600">Total Alerts</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="p-4 bg-green-100 rounded-lg">
            <div className="text-sm text-gray-600">Resolved</div>
            <div className="text-2xl font-bold">{stats.resolved}</div>
          </div>
          <div className="p-4 bg-red-100 rounded-lg">
            <div className="text-sm text-gray-600">Unresolved</div>
            <div className="text-2xl font-bold">{stats.unresolved}</div>
          </div>
          <div className="p-4 bg-purple-100 rounded-lg">
            <div className="text-sm text-gray-600">Critical</div>
            <div className="text-2xl font-bold">
              {stats.bySeverity.critical || 0}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
```

## Testing the Integration

### 1. Test Logging

```typescript
import { logger } from '@/services/logger';

// Test different log levels
logger.debug('Debug message', { data: 'test' });
logger.info('Info message', { userId: '123' });
logger.warn('Warning message', { threshold: 100 });
logger.error('Error message', new Error('Test error'), { context: 'test' });
```

### 2. Test Error Tracking

```typescript
import { reportError } from '@/utils/error-reporting';

// Test error reporting
try {
  throw new Error('Test error');
} catch (error) {
  reportError('Test error occurred', error, { test: true });
}
```

### 3. Test Performance Monitoring

```typescript
import { performanceMonitor } from '@/utils/performance-monitor';

// Test API tracking
performanceMonitor.trackAPIRequest('/api/test', 'GET', 250, 200);

// Test database tracking
performanceMonitor.trackDatabaseQuery('SELECT * FROM test', 45);

// Get report
const report = performanceMonitor.getPerformanceReport();
console.log(report);
```

### 4. Test Alerting

```typescript
import { alertingService, AlertType, AlertSeverity } from '@/services/alerting';

// Test manual alert
alertingService.createAlert(
  AlertType.SECURITY,
  AlertSeverity.WARNING,
  'Test alert',
  { test: true }
);

// Test metric tracking
for (let i = 0; i < 10; i++) {
  alertingService.trackMetric(AlertType.ERROR_RATE, 1);
}

// Get alerts
const alerts = alertingService.getAlerts();
console.log(alerts);
```

## Summary

This integration provides:

✅ Centralized logging with context
✅ Comprehensive error tracking
✅ Performance monitoring with Core Web Vitals
✅ API and database performance tracking
✅ Automated alerting with configurable thresholds
✅ Integration with Vercel Analytics
✅ Multiple notification channels

All components work together to provide complete observability of your application.
