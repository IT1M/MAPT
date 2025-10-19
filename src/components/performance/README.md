# Performance Monitoring Dashboard

## Overview

The Performance Monitoring Dashboard provides real-time insights into system performance with AI-powered optimization recommendations. It tracks API response times, error rates, and resource usage to help administrators proactively identify and resolve performance issues.

## Features

### 1. Real-Time Metrics
- **API Response Times**: P50, P95, P99 percentiles
- **Error Rates**: Track and categorize errors by type and endpoint
- **Request Volume**: Monitor total requests over time
- **Slow Endpoints**: Identify endpoints that need optimization

### 2. Alert System
- **Slow API Alerts**: Triggered when P95 > 2 seconds
- **High Error Rate**: Triggered when error rate > 5%
- **Database Size**: Warning when approaching storage limits
- **Severity Levels**: Critical and Warning alerts with admin notifications

### 3. AI-Powered Recommendations
- **Automated Analysis**: Gemini AI analyzes performance metrics
- **Prioritized Recommendations**: High, Medium, Low priority
- **Implementation Guidance**: Step-by-step instructions
- **Documentation Links**: Direct links to relevant docs
- **Impact Estimation**: Expected performance improvements
- **Progress Tracking**: Mark recommendations as implemented

### 4. Performance Optimization Categories
- **API**: Response time optimization, caching strategies
- **Database**: Query optimization, indexing, connection pooling
- **Frontend**: Bundle size, lazy loading, code splitting
- **Infrastructure**: Server configuration, resource allocation

## Components

### PerformanceMetricsCard
Displays individual performance metrics with status indicators.

```tsx
<PerformanceMetricCard
  title="Average Response Time"
  value="245ms"
  subtitle="Mean API response time"
  status="good"
  trend="down"
/>
```

### PerformanceMetricsGrid
Grid layout of key performance metrics.

```tsx
<PerformanceMetricsGrid metrics={stats.apiMetrics} />
```

### AlertsPanel
Displays active performance alerts with severity levels.

```tsx
<AlertsPanel alerts={alerts} />
```

### SlowEndpointsTable
Table of endpoints with high response times.

```tsx
<SlowEndpointsTable endpoints={slowEndpoints} />
```

### OptimizationRecommendations
AI-generated optimization recommendations with implementation tracking.

```tsx
<OptimizationRecommendations
  recommendations={recommendations}
  onMarkImplemented={handleMarkImplemented}
  confidence={0.85}
/>
```

## API Endpoints

### GET /api/performance/metrics
Returns performance statistics for a specified time range.

**Query Parameters:**
- `minutes` (optional): Time range in minutes (default: 60)

**Response:**
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
      },
      "slowEndpoints": [...]
    },
    "alerts": [...]
  }
}
```

### GET /api/performance/recommendations
Returns AI-powered optimization recommendations.

**Query Parameters:**
- `refresh` (optional): Force new analysis (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "summary": "...",
      "criticalIssues": [...],
      "recommendations": [...],
      "confidence": 0.85
    },
    "progress": {
      "total": 7,
      "implemented": 3,
      "percentage": 42.86
    }
  }
}
```

### PATCH /api/performance/recommendations
Mark a recommendation as implemented.

**Request Body:**
```json
{
  "recommendationId": "rec-1234567890-1"
}
```

### GET /api/performance/endpoint
Get metrics for a specific endpoint.

**Query Parameters:**
- `endpoint` (required): Endpoint path
- `minutes` (optional): Time range in minutes (default: 60)

## Services

### PerformanceMetricsService
Collects and analyzes API performance metrics.

```typescript
import { performanceMetricsService } from '@/services/performance-metrics'

// Record a metric
performanceMetricsService.recordAPIMetric({
  endpoint: '/api/inventory',
  method: 'GET',
  duration: 245,
  status: 200,
})

// Get statistics
const stats = performanceMetricsService.getPerformanceStats(60)

// Check alert rules
const alerts = await performanceMetricsService.checkAlertRules()
```

### PerformanceOptimizerService
Generates AI-powered optimization recommendations.

```typescript
import { performanceOptimizerService } from '@/services/performance-optimizer'

// Analyze performance
const analysis = await performanceOptimizerService.analyzePerformance()

// Mark recommendation as implemented
performanceOptimizerService.markAsImplemented('rec-id')

// Get progress
const progress = performanceOptimizerService.getImplementationProgress()
```

## Middleware

### Performance Tracking Middleware
Automatically tracks API request performance.

```typescript
import { withPerformanceTracking } from '@/middleware/performance-tracking'

export const GET = withPerformanceTracking(async (req: NextRequest) => {
  // Your handler code
  return NextResponse.json({ data: 'response' })
})
```

## Usage

### Access the Dashboard
Navigate to `/admin/performance` (Admin access required)

### Monitor Performance
1. Select time range (15 minutes to 24 hours)
2. View real-time metrics and alerts
3. Identify slow endpoints
4. Review AI recommendations

### Implement Optimizations
1. Review recommendations by priority
2. Expand details to see implementation steps
3. Follow documentation links
4. Mark as implemented when complete
5. Track progress over time

### Export Metrics
Click "Export" to download performance data as JSON for further analysis.

## Alert Thresholds

### Slow API (Warning)
- P95 response time > 2 seconds
- Action: Review slow endpoints and optimize

### Slow API (Critical)
- P95 response time > 5 seconds
- Action: Immediate optimization required

### High Error Rate (Warning)
- Error rate > 5%
- Action: Review error logs and fix issues

### High Error Rate (Critical)
- Error rate > 10%
- Action: Immediate investigation required

### Database Size (Warning)
- Database size > 80% of limit
- Action: Plan for cleanup or expansion

### Database Size (Critical)
- Database size > 90% of limit
- Action: Immediate action required

## Best Practices

1. **Regular Monitoring**: Check dashboard daily
2. **Address Critical Issues**: Prioritize critical alerts
3. **Implement Recommendations**: Follow AI suggestions
4. **Track Progress**: Mark completed optimizations
5. **Export Data**: Keep historical records
6. **Set Baselines**: Establish performance targets
7. **Continuous Improvement**: Iterate on optimizations

## Troubleshooting

### No Metrics Displayed
- Ensure API endpoints are being called
- Check that performance tracking middleware is active
- Verify time range selection

### AI Recommendations Not Loading
- Check Gemini API key configuration
- Review service logs for errors
- Use fallback recommendations if AI unavailable

### Alerts Not Triggering
- Verify alert thresholds in service configuration
- Check that metrics are being recorded
- Review alert rule logic

## Future Enhancements

- Historical trend analysis
- Custom alert rules
- Automated optimization deployment
- Performance regression detection
- Multi-region monitoring
- Real-time WebSocket updates
- Integration with external monitoring tools
