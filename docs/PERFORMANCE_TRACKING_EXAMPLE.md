# Performance Tracking Integration Example

## Before: Existing API Route

Here's an example of an existing API route without performance tracking:

```typescript
// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch data
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { deletedAt: null },
      include: {
        enteredBy: {
          select: { name: true }
        }
      }
    })

    // Process data...
    const metrics = calculateMetrics(inventoryItems)

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## After: With Performance Tracking

### Option 1: Wrap the Handler (Recommended)

```typescript
// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import { withPerformanceTracking } from '@/middleware/performance-tracking'

async function handler(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch data
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { deletedAt: null },
      include: {
        enteredBy: {
          select: { name: true }
        }
      }
    })

    // Process data...
    const metrics = calculateMetrics(inventoryItems)

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Wrap with performance tracking
export const GET = withPerformanceTracking(handler)
```

### Option 2: Manual Tracking

For more control over what gets tracked:

```typescript
// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import { performanceMetricsService } from '@/services/performance-metrics'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  let status = 200
  let error: string | undefined

  try {
    const session = await auth()
    
    if (!session) {
      status = 401
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch data
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { deletedAt: null },
      include: {
        enteredBy: {
          select: { name: true }
        }
      }
    })

    // Process data...
    const metrics = calculateMetrics(inventoryItems)

    return NextResponse.json(metrics)
  } catch (err) {
    status = 500
    error = err instanceof Error ? err.message : 'Unknown error'
    console.error('Dashboard API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    // Record performance metric
    const duration = Date.now() - startTime
    performanceMetricsService.recordAPIMetric({
      endpoint: '/api/dashboard',
      method: 'GET',
      duration,
      status,
      error,
    })
  }
}
```

## Benefits of Performance Tracking

### 1. Automatic Monitoring
- No need to manually log performance
- Consistent tracking across all endpoints
- Centralized metrics collection

### 2. Real-Time Insights
- View metrics in the performance dashboard
- Identify slow endpoints immediately
- Track error rates over time

### 3. AI-Powered Recommendations
- Get optimization suggestions
- Prioritized by impact
- Step-by-step implementation guides

### 4. Alert System
- Automatic alerts for performance issues
- Configurable thresholds
- Admin notifications

## Tracking Database Queries

For detailed database performance tracking:

```typescript
import { performanceMonitor } from '@/utils/performance-monitor'

export async function GET(request: NextRequest) {
  try {
    // Track database query performance
    const startTime = Date.now()
    
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { deletedAt: null },
      include: {
        enteredBy: {
          select: { name: true }
        }
      }
    })
    
    const queryDuration = Date.now() - startTime
    performanceMonitor.trackDatabaseQuery(
      'inventoryItem.findMany with enteredBy',
      queryDuration
    )

    // If query is slow, log warning
    if (queryDuration > 1000) {
      console.warn(`Slow query detected: ${queryDuration}ms`)
    }

    return NextResponse.json({ items: inventoryItems })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Viewing Performance Data

### 1. Access the Dashboard
Navigate to `/admin/performance` (Admin only)

### 2. View Metrics
- Average response time
- P50, P95, P99 percentiles
- Error rates
- Slow endpoints

### 3. Review Alerts
- Critical: Immediate action required
- Warning: Monitor and plan optimization

### 4. Implement Recommendations
- Filter by priority
- Follow implementation steps
- Mark as complete

## Common Optimizations

### 1. Add Database Indexes

**Before:**
```typescript
const items = await prisma.inventoryItem.findMany({
  where: {
    category: 'Medical Supplies',
    createdAt: {
      gte: lastWeek
    }
  }
})
```

**After (with index):**
```prisma
model InventoryItem {
  // ... fields
  
  @@index([category, createdAt])
}
```

### 2. Use Prisma Select

**Before:**
```typescript
const items = await prisma.inventoryItem.findMany({
  include: {
    enteredBy: true // Returns all user fields
  }
})
```

**After:**
```typescript
const items = await prisma.inventoryItem.findMany({
  include: {
    enteredBy: {
      select: {
        id: true,
        name: true,
        email: true
      }
    }
  }
})
```

### 3. Implement Caching

**Before:**
```typescript
export async function GET(request: NextRequest) {
  const stats = await calculateExpensiveStats()
  return NextResponse.json(stats)
}
```

**After:**
```typescript
import { cache } from '@/utils/cache'

export async function GET(request: NextRequest) {
  const cacheKey = 'dashboard-stats'
  
  // Try cache first
  const cached = cache.get(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }
  
  // Calculate and cache
  const stats = await calculateExpensiveStats()
  cache.set(cacheKey, stats, 5 * 60) // 5 minutes
  
  return NextResponse.json(stats)
}
```

### 4. Avoid N+1 Queries

**Before (N+1 problem):**
```typescript
const items = await prisma.inventoryItem.findMany()

for (const item of items) {
  item.user = await prisma.user.findUnique({
    where: { id: item.enteredById }
  })
}
```

**After (single query):**
```typescript
const items = await prisma.inventoryItem.findMany({
  include: {
    enteredBy: true
  }
})
```

## Monitoring Best Practices

### 1. Set Performance Budgets
```typescript
// Define acceptable thresholds
const PERFORMANCE_BUDGETS = {
  apiResponseTime: 500, // ms
  databaseQueryTime: 100, // ms
  errorRate: 0.01, // 1%
}
```

### 2. Regular Reviews
- Daily: Check for critical alerts
- Weekly: Review slow endpoints
- Monthly: Implement recommendations

### 3. Track Improvements
- Measure before optimization
- Implement changes
- Verify improvements
- Mark recommendations as complete

### 4. Document Changes
```typescript
// Add comments for optimizations
// Optimized: Added index on (category, createdAt)
// Result: Query time reduced from 2.5s to 150ms
const items = await prisma.inventoryItem.findMany({
  where: {
    category: 'Medical Supplies',
    createdAt: { gte: lastWeek }
  }
})
```

## Troubleshooting

### Performance Tracking Not Working

1. Verify middleware is imported:
```typescript
import { withPerformanceTracking } from '@/middleware/performance-tracking'
```

2. Ensure handler is wrapped:
```typescript
export const GET = withPerformanceTracking(handler)
```

3. Check service is initialized:
```typescript
import { performanceMetricsService } from '@/services/performance-metrics'
console.log('Service available:', performanceMetricsService !== null)
```

### No Metrics in Dashboard

1. Make API requests to generate metrics
2. Check time range selection
3. Verify admin access
4. Review browser console for errors

### AI Recommendations Not Loading

1. Check Gemini API key in `.env`:
```env
GEMINI_API_KEY=your-api-key-here
```

2. Verify service status:
```typescript
import { geminiService } from '@/services/gemini'
console.log('Gemini available:', geminiService.isAvailable())
```

3. Review fallback recommendations if AI unavailable

## Next Steps

1. Add performance tracking to all API routes
2. Monitor dashboard regularly
3. Implement high-priority recommendations
4. Track progress over time
5. Set up automated alerts
6. Document optimizations
7. Share insights with team
