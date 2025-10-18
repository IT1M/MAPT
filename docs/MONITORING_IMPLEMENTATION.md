# Monitoring and Error Tracking Implementation

This document provides an overview of the monitoring and error tracking system implemented for the Saudi Mais Inventory Management Application.

## Overview

The monitoring system provides comprehensive observability through:

1. **Centralized Logging** - Structured logging with context and metadata
2. **Error Tracking** - React error boundaries and global error handlers
3. **Performance Monitoring** - Core Web Vitals and API response time tracking
4. **Analytics Integration** - Vercel Analytics for user behavior and performance
5. **Alerting System** - Automated alerts for critical events

## Components

### 1. Centralized Logging Service

**File**: `src/services/logger.ts`

**Features**:
- Environment-aware log levels (debug in dev, error in prod)
- Request ID tracking for API calls
- User ID tracking for user-specific logs
- Structured JSON logging for production
- Colored console output for development
- Child loggers with preset context

**Usage**:
```typescript
import { logger } from '@/services/logger';

// Basic logging
logger.info('User logged in', { userId: '123' });
logger.error('Database error', error, { query: 'SELECT * FROM users' });

// With request tracking
logger.setRequestId('req_123');
logger.info('Processing request');
logger.clearRequestId();

// Child logger with context
const dbLogger = logger.child({ component: 'database' });
dbLogger.info('Query executed');
```

### 2. Error Tracking

**Files**:
- `src/components/shared/ErrorBoundary.tsx` - React error boundaries
- `src/utils/error-reporting.ts` - Error reporting utilities
- `src/middleware/error-logging.ts` - API error logging middleware

**Features**:
- React error boundaries for component-level error handling
- Global error handlers for unhandled errors and promise rejections
- API error logging with request context
- Error severity levels
- Integration points for external services (Sentry, Datadog)

**Usage**:
```typescript
// Wrap components with error boundary
import { ErrorBoundary } from '@/components/shared';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// Report errors manually
import { reportError } from '@/utils/error-reporting';

reportError('Failed to load data', error, { userId: '123' });

// Wrap API routes with error logging
import { withErrorLogging } from '@/middleware/error-logging';

export const GET = withErrorLogging(async (req) => {
  // Your API logic
});
```

### 3. Performance Monitoring

**Files**:
- `src/utils/performance-monitor.ts` - Performance monitoring utilities
- `src/components/shared/WebVitalsTracker.tsx` - Web Vitals tracking component

**Features**:
- Core Web Vitals tracking (LCP, FID, CLS, FCP, TTFB)
- API response time monitoring
- Database query performance tracking
- Component render time tracking
- Automatic performance reporting

**Metrics Tracked**:
- **LCP** (Largest Contentful Paint) - Loading performance
- **FID** (First Input Delay) - Interactivity
- **CLS** (Cumulative Layout Shift) - Visual stability
- **FCP** (First Contentful Paint) - Initial render
- **TTFB** (Time to First Byte) - Server response time

**Usage**:
```typescript
import { performanceMonitor } from '@/utils/performance-monitor';

// Track API request
performanceMonitor.trackAPIRequest('/api/users', 'GET', 250, 200);

// Track database query
performanceMonitor.trackDatabaseQuery('SELECT * FROM users', 45);

// Get performance report
const report = performanceMonitor.getPerformanceReport();
```

### 4. Vercel Analytics Integration

**Files**:
- `src/components/shared/VercelAnalytics.tsx` - Analytics integration
- `docs/VERCEL_ANALYTICS_SETUP.md` - Setup guide

**Features**:
- Web Analytics for page views and user behavior
- Speed Insights for Core Web Vitals
- Custom event tracking
- Performance metrics reporting

**Setup**:
1. Install packages: `npm install @vercel/analytics @vercel/speed-insights`
2. Enable in Vercel dashboard
3. Uncomment components in `VercelAnalytics.tsx`
4. Add to root layout

**Usage**:
```typescript
import { trackEvent, trackPageView } from '@/components/shared';

// Track custom events
trackEvent('button_click', { button: 'submit' });

// Track page views
trackPageView('/dashboard');
```

### 5. Alerting System

**Files**:
- `src/services/alerting.ts` - Alerting service
- `docs/ALERTS_CONFIGURATION.md` - Configuration guide

**Features**:
- Configurable alert thresholds
- Multiple severity levels (INFO, WARNING, ERROR, CRITICAL)
- Multiple notification channels (Email, Slack, SMS)
- Automatic threshold monitoring
- Alert resolution tracking

**Alert Types**:
- Error rate alerts (> 1% in 5 minutes)
- Response time alerts (> 3s average)
- Database connection alerts (> 3 failures)
- Performance alerts (poor Core Web Vitals)
- Deployment alerts
- Security alerts

**Usage**:
```typescript
import { alertingService, AlertType, AlertSeverity } from '@/services/alerting';

// Create manual alert
alertingService.createAlert(
  AlertType.SECURITY,
  AlertSeverity.CRITICAL,
  'Unauthorized access detected'
);

// Track metrics (automatic alerting)
alertingService.trackMetric(AlertType.ERROR_RATE, 1);
alertingService.trackMetric(AlertType.RESPONSE_TIME, 3500);

// Get alerts
const alerts = alertingService.getAlerts({ resolved: false });
```

## Integration Points

### Application Initialization

Add to your root layout (`src/app/layout.tsx`):

```typescript
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { WebVitalsTracker } from '@/components/shared/WebVitalsTracker';
import { VercelAnalytics } from '@/components/shared/VercelAnalytics';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        
        <WebVitalsTracker />
        <VercelAnalytics />
      </body>
    </html>
  );
}
```

### Global Error Handler

Add to your client-side entry point:

```typescript
import { setupGlobalErrorHandlers } from '@/utils/error-reporting';

// Initialize global error handlers
if (typeof window !== 'undefined') {
  setupGlobalErrorHandlers();
}
```

### API Routes

Wrap API routes with error logging:

```typescript
import { withErrorLogging } from '@/middleware/error-logging';
import { performanceMonitor } from '@/utils/performance-monitor';
import { alertingService, AlertType } from '@/services/alerting';

export const GET = withErrorLogging(async (req) => {
  const startTime = Date.now();
  
  try {
    const result = await fetchData();
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackAPIRequest(req.url, 'GET', duration, 200);
    alertingService.trackMetric(AlertType.RESPONSE_TIME, duration);
    alertingService.trackMetric(AlertType.ERROR_RATE, 0);
    
    return NextResponse.json(result);
  } catch (error) {
    alertingService.trackMetric(AlertType.ERROR_RATE, 1);
    throw error;
  }
});
```

## Environment Variables

Add to `.env`:

```bash
# Logging
LOG_LEVEL=info  # debug, info, warn, error
NODE_ENV=production

# Email Notifications
EMAIL_SERVER=smtp://smtp.example.com:587
EMAIL_FROM=alerts@yourdomain.com
ALERT_EMAIL_TO=admin@yourdomain.com

# Slack Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Optional: SMS Notifications
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
ALERT_PHONE_NUMBER=+1234567890
```

## Monitoring Dashboard

### Vercel Dashboard

Access monitoring data in Vercel:

1. **Analytics** - Page views, visitors, top pages
2. **Speed Insights** - Core Web Vitals, performance scores
3. **Logs** - Application logs and errors
4. **Deployments** - Deployment history and status

### Custom Dashboard (Future)

Create a custom monitoring dashboard:

```typescript
// pages/admin/monitoring.tsx
import { performanceMonitor } from '@/utils/performance-monitor';
import { alertingService } from '@/services/alerting';

export default function MonitoringPage() {
  const report = performanceMonitor.getPerformanceReport();
  const alerts = alertingService.getAlerts({ limit: 50 });
  const stats = alertingService.getStatistics();
  
  return (
    <div>
      <h1>System Monitoring</h1>
      <PerformanceMetrics report={report} />
      <AlertsList alerts={alerts} />
      <AlertStatistics stats={stats} />
    </div>
  );
}
```

## Performance Targets

### Core Web Vitals

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | < 2.5s | 2.5s - 4s | > 4s |
| FID | < 100ms | 100ms - 300ms | > 300ms |
| CLS | < 0.1 | 0.1 - 0.25 | > 0.25 |
| FCP | < 1.8s | 1.8s - 3s | > 3s |
| TTFB | < 800ms | 800ms - 1800ms | > 1800ms |

### API Response Times

- **Excellent**: < 200ms
- **Good**: 200ms - 500ms
- **Acceptable**: 500ms - 1000ms
- **Slow**: 1000ms - 3000ms
- **Critical**: > 3000ms

### Error Rates

- **Healthy**: < 0.1%
- **Acceptable**: 0.1% - 1%
- **Warning**: 1% - 2%
- **Critical**: > 2%

## Best Practices

1. **Log Appropriately** - Use correct log levels
2. **Add Context** - Include relevant metadata in logs
3. **Monitor Continuously** - Review metrics regularly
4. **Set Realistic Thresholds** - Avoid alert fatigue
5. **Resolve Alerts** - Mark alerts as resolved when fixed
6. **Test Regularly** - Test monitoring and alerting monthly
7. **Document Incidents** - Keep records of issues and resolutions
8. **Review Performance** - Analyze trends and optimize

## Troubleshooting

### Logs Not Appearing

1. Check LOG_LEVEL environment variable
2. Verify logger is imported correctly
3. Check console output in development
4. Review Vercel logs in production

### Alerts Not Triggering

1. Verify thresholds are configured
2. Check metrics are being tracked
3. Review alert service initialization
4. Test notification channels manually

### Performance Metrics Missing

1. Verify Web Vitals tracker is initialized
2. Check browser compatibility
3. Test in production (not development)
4. Review browser console for errors

## Next Steps

1. **Install Vercel Analytics** - Follow setup guide
2. **Configure Notifications** - Set up email and Slack
3. **Test Alerting** - Trigger test alerts
4. **Monitor Production** - Review metrics after deployment
5. **Optimize Performance** - Address slow metrics
6. **Create Dashboards** - Build custom monitoring views

## Documentation

- [Vercel Analytics Setup](./VERCEL_ANALYTICS_SETUP.md)
- [Alerts Configuration](./ALERTS_CONFIGURATION.md)
- [Error Tracking Guide](./ERROR_TRACKING.md) (to be created)
- [Performance Optimization](./PERFORMANCE_OPTIMIZATION.md) (to be created)

## Support

For issues or questions:

1. Review this documentation
2. Check application logs
3. Test monitoring components
4. Review Vercel dashboard
5. Contact system administrator
