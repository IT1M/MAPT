# Performance Monitoring Integration Guide

## Overview

This guide explains how to integrate the Performance Monitoring system into your application to track API performance, receive alerts, and get AI-powered optimization recommendations.

## Quick Start

### 1. Access the Dashboard

Navigate to `/admin/performance` (requires Admin role) to view:
- Real-time performance metrics
- Active alerts
- Slow endpoints
- AI-powered optimization recommendations

### 2. Automatic Performance Tracking

The performance monitoring system automatically tracks all API requests when you wrap your route handlers with the performance tracking middleware.

## Integration Steps

### Step 1: Wrap API Route Handlers

Add performance tracking to your API routes:

```typescript
// src/app/api/your-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withPerformanceTracking } from '@/middleware/performance-tracking'

async function handler(req: NextRequest) {
  // Your existing handler code
  const data = await fetchData()
  return NextResponse.json({ data })
}

// Wrap with performance tracking
export const GET = withPerformanceTracking(handler)
export const POST = withPerformanceTracking(handler)
```

### Step 2: Monitor Performance

The system automatically:
- Records request duration
- Tracks response status codes
- Logs errors
- Calculates percentiles (P50, P95, P99)
- Identifies slow endpoints

### Step 3: Review Alerts

Alerts are automatically generated when:
- API P95 response time > 2 seconds
- Error rate > 5%
- Database size > 80% of limit

### Step 4: Implement Recommendations

1. Review AI-generated recommendations in the dashboard
2. Filter by priority (High, Medium, Low)
3. Expand details to see implementation steps
4. Follow documentation links
5. Mark as implemented when complete

## Manual Performance Tracking

For custom performance tracking outside of API routes:

```typescript
import { performanceMetricsService } from '@/services/performance-metrics'

// Record a custom metric
performanceMetricsService.recordAPIMetric({
  endpoint: '/custom-operation',
  method: 'CUSTOM',
  duration: 1250,
  status: 200,
  userId: 'user-id',
})
```

## Database Query Performance

Track slow database queries:

```typescript
import { performanceMonitor } from '@/utils/performance-monitor'

const startTime = Date.now()
const result = await prisma.inventoryItem.findMany()
const duration = Date.now() - startTime

performanceMonitor.trackDatabaseQuery('findMany inventoryItem', duration)
```

## Alert Configuration

### Default Alert Rules

```typescript
// Slow API threshold
const SLOW_API_THRESHOLD = 2000 // 2 seconds

// Error rate threshold
const ERROR_RATE_THRESHOLD = 0.05 // 5%

// Database size threshold
const DB_SIZE_THRESHOLD = 0.8 // 80% of limit
```

### Custom Alert Handling

```typescript
import { performanceMetricsService } from '@/services/performance-metrics'

// Check alerts programmatically
const alerts = await performanceMetricsService.checkAlertRules()

// Send notifications for critical alerts
alerts
  .filter(alert => alert.severity === 'critical')
  .forEach(alert => {
    // Send notification to admins
    sendAdminNotification(alert.message)
  })
```

## AI Recommendations

### Trigger Analysis

```typescript
import { performanceOptimizerService } from '@/services/performance-optimizer'

// Analyze performance and get recommendations
const analysis = await performanceOptimizerService.analyzePerformance()

console.log('Summary:', analysis.summary)
console.log('Critical Issues:', analysis.criticalIssues)
console.log('Recommendations:', analysis.recommendations)
```

### Track Implementation Progress

```typescript
// Mark recommendation as implemented
performanceOptimizerService.markAsImplemented('rec-id')

// Get progress
const progress = performanceOptimizerService.getImplementationProgress()
console.log(`${progress.implemented}/${progress.total} recommendations implemented`)
```

## API Endpoints

### Get Performance Metrics

```bash
GET /api/performance/metrics?minutes=60
```

Response:
```json
{
  "success": true,
  "data": {
    "stats": {
      "apiMetrics": {
        "p50": 150,
        "p95": 450,
        "p99": 850,
        "avgResponseTime": 245,
        "totalRequests": 1250,
        "errorRate": 0.024
      }
    },
    "alerts": []
  }
}
```

### Get Recommendations

```bash
GET /api/performance/recommendations
```

Response:
```json
{
  "success": true,
  "data": {
    "analysis": {
      "summary": "System performance is good...",
      "recommendations": [...]
    },
    "progress": {
      "total": 7,
      "implemented": 3,
      "percentage": 42.86
    }
  }
}
```

### Mark Recommendation as Implemented

```bash
PATCH /api/performance/recommendations
Content-Type: application/json

{
  "recommendationId": "rec-1234567890-1"
}
```

## Best Practices

### 1. Wrap All API Routes

Ensure all API routes use the performance tracking middleware:

```typescript
export const GET = withPerformanceTracking(handler)
export const POST = withPerformanceTracking(handler)
export const PUT = withPerformanceTracking(handler)
export const DELETE = withPerformanceTracking(handler)
```

### 2. Monitor Regularly

- Check the dashboard daily
- Address critical alerts immediately
- Review recommendations weekly
- Track implementation progress

### 3. Optimize Proactively

- Implement high-priority recommendations first
- Test optimizations in development
- Monitor impact after deployment
- Document changes

### 4. Set Performance Budgets

Define acceptable thresholds:
- API response time: < 500ms (P95)
- Error rate: < 1%
- Database queries: < 100ms

### 5. Use Time Ranges Effectively

- **15 minutes**: Real-time monitoring
- **1 hour**: Recent performance trends
- **6 hours**: Daily patterns
- **24 hours**: Full day analysis

## Troubleshooting

### High Response Times

1. Check slow endpoints table
2. Review database queries
3. Implement caching
4. Add database indexes
5. Optimize Prisma queries

### High Error Rates

1. Review error logs
2. Check error breakdown by type
3. Add input validation
4. Implement error boundaries
5. Add retry logic

### Database Performance

1. Review slow queries
2. Add missing indexes
3. Optimize query patterns
4. Configure connection pooling
5. Use Prisma select efficiently

## Example: Optimizing a Slow Endpoint

### Before Optimization

```typescript
// Slow: N+1 query problem
export const GET = withPerformanceTracking(async (req: NextRequest) => {
  const items = await prisma.inventoryItem.findMany()
  
  // N+1 queries
  for (const item of items) {
    item.user = await prisma.user.findUnique({
      where: { id: item.enteredById }
    })
  }
  
  return NextResponse.json({ items })
})
```

### After Optimization

```typescript
// Fast: Single query with include
export const GET = withPerformanceTracking(async (req: NextRequest) => {
  const items = await prisma.inventoryItem.findMany({
    include: {
      enteredBy: {
        select: { id: true, name: true, email: true }
      }
    }
  })
  
  return NextResponse.json({ items })
})
```

## Monitoring Impact

After implementing optimizations:

1. Check the performance dashboard
2. Compare metrics before/after
3. Verify alert resolution
4. Mark recommendation as implemented
5. Document improvements

## Support

For issues or questions:
- Review the Performance Monitoring README
- Check service logs for errors
- Verify Gemini API configuration
- Contact system administrators

## Next Steps

1. Integrate performance tracking in all API routes
2. Set up regular monitoring schedule
3. Implement high-priority recommendations
4. Track progress over time
5. Continuously optimize based on insights
